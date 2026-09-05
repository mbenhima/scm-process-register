import sys
import subprocess
import time
import uno
from com.sun.star.beans import PropertyValue


def make_prop(name, value):
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p


def main(in_path, out_path, pdf_path=None):
    port = 2002
    proc = subprocess.Popen([
        'soffice', '--headless', '--invisible', '--nocrashreport', '--nodefault',
        '--norestore', '--nologo', '--nofirststartwizard',
        f'--accept=socket,host=localhost,port={port};urp;',
    ])
    time.sleep(8)

    local_ctx = uno.getComponentContext()
    resolver = local_ctx.ServiceManager.createInstanceWithContext(
        'com.sun.star.bridge.UnoUrlResolver', local_ctx)
    ctx = None
    for _ in range(20):
        try:
            ctx = resolver.resolve(
                f'uno:socket,host=localhost,port={port};urp;StarOffice.ComponentContext')
            break
        except Exception:
            time.sleep(1)
    if ctx is None:
        raise RuntimeError('Could not connect to LibreOffice')

    smgr = ctx.ServiceManager
    desktop = smgr.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)

    in_url = 'file://' + in_path
    out_url = 'file://' + out_path

    load_props = (make_prop('Hidden', True),)
    doc = desktop.loadComponentFromURL(in_url, '_blank', 0, load_props)

    # LibreOffice's DOCX import filter correctly names each heading
    # paragraph's ParaStyleName ("Heading 1" / "Heading 2" / "Heading 3") but
    # leaves the runtime OutlineLevel direct-formatting property at 0 for
    # every one of them — so CreateFromOutline (below), which walks
    # OutlineLevel rather than style name, finds nothing and silently
    # generates a zero-entry TOC. Explicitly restore OutlineLevel from the
    # style name before generating the index.
    HEADING_LEVELS = {'Heading 1': 1, 'Heading 2': 2, 'Heading 3': 3}
    enum = doc.getText().createEnumeration()
    while enum.hasMoreElements():
        para = enum.nextElement()
        if para.supportsService('com.sun.star.text.Paragraph'):
            level = HEADING_LEVELS.get(para.ParaStyleName)
            if level:
                para.OutlineLevel = level

    # Find the {{TOC_PLACEHOLDER}} paragraph and replace it with a genuine
    # LibreOffice ContentIndex (native TOC built from outline/heading
    # levels 1-3). A docx.js-authored TOC field survives DOCX import as an
    # inert SDT content control that LO's DocumentIndexes API never
    # recognizes (getCount() == 0), so it can never be "updated" — inserting
    # a real LO index here, then exporting to DOCX, bakes real page numbers
    # in that any viewer (Word, LO, a PDF) will show correctly.
    search = doc.createSearchDescriptor()
    search.SearchString = 'TOCPLACEHOLDERXYZ'
    found = doc.findFirst(search)
    if found is None:
        raise RuntimeError('TOC placeholder not found in document')

    toc = doc.createInstance('com.sun.star.text.ContentIndex')
    toc.CreateFromOutline = True
    toc.Level = 3
    toc.Title = ''

    text = found.getText()
    text.insertTextContent(found, toc, True)
    toc.update()

    # NOTE: deliberately NOT calling doc.store() here — that would save back
    # over the ORIGINAL input path (mutating the docx.js-generated source
    # file in place), which breaks re-running this script against a fresh
    # source. Only the explicit -final.docx / -final.pdf outputs are written.
    save_props = (make_prop('FilterName', 'MS Word 2007 XML'),)
    doc.storeToURL(out_url, save_props)

    # Export PDF directly from THIS live session, not from a later re-load of
    # the .docx. LibreOffice's DOCX export filter serializes the TOC field
    # as a live Word field with no cached display text (Word itself
    # re-evaluates it on open because of the updateFields setting, but a
    # later headless `soffice --convert-to pdf` re-import does not) — so a
    # PDF produced from a *re-loaded* .docx would show a blank TOC page even
    # though the in-memory document, right here, already has the fully
    # resolved index content from the update() call above.
    if pdf_path:
        pdf_url = 'file://' + pdf_path
        pdf_props = (make_prop('FilterName', 'writer_pdf_Export'),)
        doc.storeToURL(pdf_url, pdf_props)

    doc.close(False)

    proc.terminate()


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)

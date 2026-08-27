import sys
import uno
from com.sun.star.beans import PropertyValue

def make_prop(name, value):
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p

def main(in_path, out_pdf_path, out_docx_path=None):
    localContext = uno.getComponentContext()
    resolver = localContext.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", localContext)
    ctx = resolver.resolve(
        "uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
    smgr = ctx.ServiceManager
    desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

    in_url = uno.systemPathToFileUrl(in_path)
    out_pdf_url = uno.systemPathToFileUrl(out_pdf_path)

    load_props = (make_prop("Hidden", True),)
    doc = desktop.loadComponentFromURL(in_url, "_blank", 0, load_props)

    # Update all document indexes (TOC etc.)
    indexes = doc.getDocumentIndexes()
    for i in range(indexes.getCount()):
        idx = indexes.getByIndex(i)
        idx.update()

    # Update all text fields (PAGE, etc.)
    doc.getTextFields().refresh()

    export_props = (make_prop("FilterName", "writer_pdf_Export"),)
    doc.storeToURL(out_pdf_url, export_props)

    # Also save the DOCX itself with the now-computed TOC/PAGE field results
    # baked in as cached content -- otherwise the shipped .docx keeps an
    # empty TOC field that only shows real page numbers if the viewer
    # recalculates fields on open (not guaranteed in every Word/viewer).
    if out_docx_path:
        out_docx_url = uno.systemPathToFileUrl(out_docx_path)
        docx_props = (make_prop("FilterName", "MS Word 2007 XML"),)
        doc.storeToURL(out_docx_url, docx_props)

    doc.close(False)
    print("done:", out_pdf_path, out_docx_path or '')

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)

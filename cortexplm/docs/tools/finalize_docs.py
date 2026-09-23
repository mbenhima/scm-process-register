"""Opens each .docx in LibreOffice, refreshes the table of contents and page fields, saves it, and exports a PDF.
Run: python3 finalize_docs.py file1.docx [file2.docx ...]"""
import os, subprocess, sys, time
import uno
from com.sun.star.beans import PropertyValue

def prop(n, v):
    p = PropertyValue(); p.Name, p.Value = n, v; return p

def main(files):
    port = 2002
    proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--nologo', '--norestore', f'--accept=socket,host=localhost,port={port};urp;'])
    try:
        ctx = uno.getComponentContext()
        resolver = ctx.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', ctx)
        for _ in range(60):
            try: remote = resolver.resolve(f'uno:socket,host=localhost,port={port};urp;StarOffice.ComponentContext'); break
            except Exception: time.sleep(0.5)
        desktop = remote.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', remote)
        for f in files:
            url = uno.systemPathToFileUrl(os.path.abspath(f))
            doc = desktop.loadComponentFromURL(url, '_blank', 0, (prop('Hidden', True),))
            for _ in range(2):  # twice: the TOC changes page numbers
                idx = doc.getDocumentIndexes()
                for i in range(idx.getCount()): idx.getByIndex(i).update()
                doc.getTextFields().refresh()
            doc.storeToURL(url, (prop('FilterName', 'MS Word 2007 XML'),))
            doc.storeToURL(uno.systemPathToFileUrl(os.path.abspath(f[:-5] + '.pdf')), (prop('FilterName', 'writer_pdf_Export'),))
            doc.close(True)
            print('finalized', f)
    finally:
        proc.terminate()

if __name__ == '__main__':
    main(sys.argv[1:])

"""Opens Word/PowerPoint files in LibreOffice (headless, UNO), refreshes the table
of contents and fields, saves the .docx back with the populated TOC and exports a PDF.
Usage: python3 lo_convert.py file1.docx file2.pptx ..."""
import os
import subprocess
import sys
import time

import uno
from com.sun.star.beans import PropertyValue


def prop(name, value):
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p


def connect():
    proc = subprocess.Popen(['soffice', '--headless', '--invisible', '--nologo', '--norestore', '--accept=socket,host=127.0.0.1,port=2002;urp;'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext('com.sun.star.bridge.UnoUrlResolver', local)
    for _ in range(60):
        try:
            ctx = resolver.resolve('uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext')
            return proc, ctx.ServiceManager.createInstanceWithContext('com.sun.star.frame.Desktop', ctx)
        except Exception:
            time.sleep(0.5)
    raise RuntimeError('LibreOffice did not start')


def convert(desktop, path):
    url = uno.systemPathToFileUrl(os.path.abspath(path))
    base, ext = os.path.splitext(os.path.abspath(path))
    flt = 'MS Word 2007 XML' if ext == '.docx' else 'Impress MS PowerPoint 2007 XML'
    doc = None
    for _ in range(10):
        try:
            doc = desktop.loadComponentFromURL(url, '_blank', 0, (prop('Hidden', True), prop('FilterName', flt)))
            break
        except Exception as e:
            print('retry load:', e.__class__.__name__)
            time.sleep(2)
    if ext == '.docx':
        for _ in range(2):
            idx = doc.getDocumentIndexes()
            for i in range(idx.getCount()):
                idx.getByIndex(i).update()
            doc.getTextFields().refresh()
        doc.storeToURL(url, (prop('FilterName', 'MS Word 2007 XML'), prop('Overwrite', True)))
        doc.storeToURL(uno.systemPathToFileUrl(base + '.pdf'), (prop('FilterName', 'writer_pdf_Export'),))
    else:
        doc.storeToURL(uno.systemPathToFileUrl(base + '.pdf'), (prop('FilterName', 'impress_pdf_Export'),))
    doc.close(True)
    print('converted', base + '.pdf')


if __name__ == '__main__':
    proc, desktop = connect()
    try:
        for f in sys.argv[1:]:
            convert(desktop, f)
    finally:
        try:
            desktop.terminate()
        except Exception:
            pass
        time.sleep(1)
        proc.kill()

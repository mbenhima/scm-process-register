"""Converts .docx/.pptx files to PDF with LibreOffice, refreshing every table of contents first
(and saving the refreshed .docx back), so the Word file and its PDF both show a filled TOC.
Usage: python3 topdf.py file1.docx [file2.pptx ...]"""
import os, subprocess, sys, tempfile, time, pathlib
import uno
from com.sun.star.beans import PropertyValue

def prop(name, value):
    p = PropertyValue(); p.Name = name; p.Value = value; return p

files = [pathlib.Path(f).resolve() for f in sys.argv[1:]]
profile = tempfile.mkdtemp(prefix="lo_uno_")
port = 2002 + os.getpid() % 500
env = dict(os.environ, SAL_USE_VCLPLUGIN="svp")
proc = subprocess.Popen(["soffice", f"-env:UserInstallation=file://{profile}", "--headless", "--invisible", "--nologo", "--norestore",
                         f"--accept=socket,host=127.0.0.1,port={port};urp;"], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ctx = None
for _ in range(60):
    try:
        local = uno.getComponentContext()
        resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
        ctx = resolver.resolve(f"uno:socket,host=127.0.0.1,port={port};urp;StarOffice.ComponentContext"); break
    except Exception:
        time.sleep(1)
if ctx is None:
    proc.kill(); sys.exit("LibreOffice did not start")
desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
try:
    for f in files:
        doc = desktop.loadComponentFromURL(f.as_uri(), "_blank", 0, (prop("Hidden", True),))
        if f.suffix == ".docx":
            idx = doc.getDocumentIndexes()
            for i in range(idx.getCount()): idx.getByIndex(i).update()
            doc.refresh()
            for i in range(idx.getCount()): idx.getByIndex(i).update()  # second pass: page numbers after the TOC grew
            doc.storeToURL(f.as_uri(), (prop("FilterName", "MS Word 2007 XML"),))
            flt = "writer_pdf_Export"
        else:
            flt = "impress_pdf_Export"
        doc.storeToURL(f.with_suffix(".pdf").as_uri(), (prop("FilterName", flt),))
        doc.close(True)
        print("pdf", f.with_suffix(".pdf").name)
finally:
    try: desktop.terminate()
    except Exception: pass
    time.sleep(1); proc.kill()

import sys
import uno
from com.sun.star.beans import PropertyValue

def make_prop(name, value):
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p

def main(in_path, out_path):
    localContext = uno.getComponentContext()
    resolver = localContext.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", localContext)
    ctx = resolver.resolve(
        "uno:socket,host=localhost,port=2002;urp;StarOffice.ComponentContext")
    smgr = ctx.ServiceManager
    desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)

    in_url = uno.systemPathToFileUrl(in_path)
    out_url = uno.systemPathToFileUrl(out_path)

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
    doc.storeToURL(out_url, export_props)

    doc.close(False)
    print("done:", out_path)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

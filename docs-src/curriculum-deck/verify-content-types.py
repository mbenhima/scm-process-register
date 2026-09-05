import re, sys, zipfile

def check(path):
    z = zipfile.ZipFile(path)
    names = set(z.namelist())
    ct = z.read('[Content_Types].xml').decode('utf-8')
    parts = re.findall(r'<Override PartName="([^"]+)"', ct)
    missing = [p for p in parts if p.lstrip('/') not in names]
    if missing:
        print(f"{path}: FAIL — {len(missing)} declared part(s) missing from zip:")
        for m in missing:
            print("  -", m)
        return False
    print(f"{path}: OK — all {len(parts)} declared Content_Types parts exist ({len(names)} files in zip)")
    return True

ok = True
for p in sys.argv[1:]:
    ok = check(p) and ok
sys.exit(0 if ok else 1)

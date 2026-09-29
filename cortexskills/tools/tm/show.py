import json,sys
c=json.load(open(sys.argv[1]))
for i,s in enumerate(c): print(f"{i}\t{s}")

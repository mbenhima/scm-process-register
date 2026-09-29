import json,sys
c=json.load(open(sys.argv[1])); r=set(json.load(open(sys.argv[2])))
for i,s in enumerate(c):
  if s in r: print(f"{i}\t{s}")

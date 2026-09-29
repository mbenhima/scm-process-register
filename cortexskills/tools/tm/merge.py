# Merge scratchpad translations out{NN}.tsv (idx \t fr \t ar) with src{NN}.json into seed/i18n/tm.{fr,ar}.NN.json
import json,sys,glob,os,re
SP=os.path.dirname(__file__); dst='/home/user/scm-process-register/cortexskills/server/seed/i18n'; os.makedirs(dst,exist_ok=True)
for f in sorted(glob.glob(SP+'/out*.tsv')):
  n=re.search(r'out(\d+)',f).group(1); src=json.load(open(f'{SP}/src{n}.json'))
  fr={};ar={};bad=[]
  for line in open(f,encoding='utf8'):
    line=line.rstrip('\n')
    if not line.strip(): continue
    p=line.split('\t')
    if len(p)!=3: bad.append(line[:60]); continue
    i=int(p[0]); fr[src[i]]=p[1].strip(); ar[src[i]]=p[2].strip()
  miss=[i for i,s in enumerate(src) if s not in fr]
  json.dump(fr,open(f'{dst}/tm.fr.{n}.json','w'),ensure_ascii=False,indent=0)
  json.dump(ar,open(f'{dst}/tm.ar.{n}.json','w'),ensure_ascii=False,indent=0)
  print(n,len(src),'ok' if not miss and not bad else f'MISSING {miss[:20]} BAD {bad[:3]}')

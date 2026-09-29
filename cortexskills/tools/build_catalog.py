"""Builds server/seed/data/catalog.json from the source deliverables (process design, packs, workbook).
Usage: python3 tools/build_catalog.py <scratch_dir_with_md_and_wb_json>"""
import json, re, sys, os
S = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'server', 'seed', 'data', 'catalog.json')
wb = lambda n: json.load(open(os.path.join(S, 'wb', n + '.json')))
def cells(l): return [c.strip() for c in l.strip().strip('|').split('|')]
P = open(os.path.join(S, 'CortexSkills_Process_Design_E2E_v4.md')).read().split('\n')
K = open(os.path.join(S, 'CortexSkills_Packs_Integrations_AddOns.md')).read().split('\n')
parsed = json.load(open(os.path.join(S, 'e2e_parsed.json')))
e0123 = json.load(open(os.path.join(os.path.dirname(OUT), 'e2e_01_23.json')))

# ---------- macro processes
cat = {}
i = P.index('## 4.1  Summary of All 52 Macro Processes')
for l in P[i:i+60]:
    if l.startswith('| MP-'):
        c = cells(l); cat[c[0]] = c[2]
cat['MP-51'] = 'Administration'; cat['MP-52'] = 'Administration'
def family(n):
    n = int(n[3:])
    return ('Core Training Engineering' if n <= 23 else 'Innovation & Differentiation' if n <= 35 else
            'Consulting & Diagnostic Excellence' if n <= 42 else 'Strategic & Organizational Excellence' if n <= 50 else
            'Platform Administration' if n <= 52 else 'Scope & Questionnaire Excellence')
sipoc = {}; cur = None
for l in P:
    m = re.match(r'### (MP-\d\d): ', l)
    if m: cur = m.group(1); sipoc[cur] = {}; continue
    if l.startswith('## 4.3'): cur = None
    if cur and l.startswith('| '):
        c = cells(l); key = {'Goals':'goals','Suppliers (S)':'suppliers','Inputs (I)':'inputs','Process (P)':'process','Outputs (O)':'outputs','Customers (C)':'customers'}.get(c[0])
        if key: sipoc[cur][key] = c[1]
cov = {}
i = P.index('## 8.2  Coverage Matrix')
for l in P[i:i+60]:
    if l.startswith('| MP-'):
        c = cells(l); cov[c[0]] = [x.strip() for x in c[2].split(',')]
steps = wb('D02_Tasks_Steps')
mps = []
for r in wb('D01_Macro_Processes'):
    mid = r['Macro_Process_ID']
    mps.append({'id': mid, 'name': r['Name'], 'objective': r['Objective'], 'trigger': r['Trigger'], 'terminal': r['Terminal_State'],
                'owner': r['Owner_Role'], 'module': r['Associated_Module'], 'category': cat.get(mid, ''), 'family': family(mid),
                'sipoc': sipoc.get(mid), 'coveredBy': cov.get(mid, [])})
tasks = []; tmap = {}
for s in steps:
    key = (s['Parent_Macro_Process_ID'], s['Task_Name'])
    if key not in tmap:
        n = sum(1 for t in tasks if t['mp'] == key[0]) + 1
        tmap[key] = '%s.T%d' % (key[0], n)
        tasks.append({'id': tmap[key], 'mp': key[0], 'name': key[1]})
    s['taskId'] = tmap[key]
stepList = [{'id': s['Step_ID'], 'mp': s['Parent_Macro_Process_ID'], 'task': s['taskId'], 'name': s['Step_Name'], 'type': s['Step_Type'],
             'description': s['Description'], 'role': s['Responsible_Role']} for s in steps]
stepIds = [s['id'] for s in stepList]

# ---------- E2E
e2es = []
for k, v in parsed['e2e'].items():
    num = k[4:]
    e = {'id': k, 'name': v['name'], 'type': v['type'], 'goal': v['goal'], 'mps': v['mps'], 'stepsCount': v['steps'],
         'relType': v.get('relType', ''), 'relatedTo': v.get('relatedTo', '')}
    if k in e0123:
        src = e0123[k]
        e.update({x: src[x] for x in ('trigger', 'terminal', 'feedsInto', 'supportedBy', 'consumes', 'modules', 'description')})
        ufts = []
        for j, line in enumerate(src['ufts']):
            f = line.split('|')
            ufts.append({'id': 'UFT-%s-%02d' % (num, j+1), 'name': f[0], 'description': f[1], 'goal': f[0], 'steps': f[2].split(';'),
                         'racsi': dict(zip('RACSI', f[3:8])), 'input': f[8], 'supplier': f[3], 'output': f[9], 'beneficiary': f[7],
                         'stepId': 'S%s-%02d' % (num, j+1), 'seqTask': f[2].split(';')[0].replace('MP-', 'MP').replace('.', '-T'),
                         'mp': f[2].split(';')[0].split('.')[0]})
    else:
        e.update({'trigger': v['trigger'], 'terminal': v['terminal'], 'feedsInto': v.get('feedsInto', ''), 'supportedBy': v.get('supportedBy', '—'),
                  'consumes': v.get('consumes', '—'), 'modules': v['modules'], 'description': v['description']})
        ufts = []
        primary = v['ufts'][0]['mp']
        for u in v['ufts']:
            linked = []
            for m in re.findall(r'MP(\d\d)-T(\d\d)', u['seqTasks']):
                sid = 'MP-%s.%d' % (m[0], int(m[1]))
                if m[0] == '53':  # D02 has 10 steps for MP-53; T11 publish -> .10, T12 track changes -> .9
                    sid = {11: 'MP-53.10', 12: 'MP-53.9'}.get(int(m[1]), sid)
                if sid in stepIds and sid not in linked: linked.append(sid)
            ufts.append({'id': u['id'], 'name': u['name'], 'description': u['description'], 'goal': u['goal'], 'steps': linked,
                         'racsi': u['racsi'], 'input': u['input'], 'supplier': u['supplier'], 'output': u['output'], 'beneficiary': u['beneficiary'],
                         'stepId': u['stepId'], 'seqTask': u['seqTasks'], 'mp': u['mp'], 'stepVerb': u['stepVerb']})
        # attach every uncovered step of the primary MP to the UFT holding the nearest preceding step
        mpSteps = [s for s in stepIds if s.startswith(primary + '.')]
        covered = {s for u in ufts for s in u['steps']}
        for s in mpSteps:
            if s in covered: continue
            n = int(s.split('.')[1]); best = ufts[0]
            for u in ufts:
                idx = [int(x.split('.')[1]) for x in u['steps'] if x.startswith(primary + '.')]
                if idx and min(idx) <= n: best = u
            best['steps'].append(s)
        for u in ufts: u['steps'].sort(key=lambda x: (x.split('.')[0], int(x.split('.')[1])))
    n = len(ufts)
    for j, u in enumerate(ufts):
        u['bpmn'] = 'Start Event' if j == 0 else 'End Event' if j == n - 1 else 'Task'
        u['order'] = j + 1
    e['ufts'] = ufts
    e2es.append(e)
covered = {s for e in e2es for u in e['ufts'] for s in u['steps']}
print('steps covered by E2E:', len(covered), '/', len(stepIds), 'uncovered:', sorted(set(stepIds) - covered))

# ---------- glossary
gl = []
i = P.index('## 3.2  Complete Glossary')
for l in P[i+2:i+60]:
    if l.startswith('| ') and not l.startswith('| French'):
        c = cells(l); gl.append({'fr': c[0], 'en': c[1]})
    if l.startswith('SECTION 4'): break

# ---------- packs / integrations / addons
packs = []
i = K.index('## 2.1  Pack Summary')
for l in K[i:i+12]:
    if l.startswith('| PK-'):
        c = cells(l); packs.append({'id': c[0], 'name': c[1], 'segment': c[2], 'price': float(c[3].strip('$')), 'mps': c[4]})
pmap = {p['id']: p for p in packs}
cur = None; mode = None
for l in K:
    m = re.match(r'## (PK-\d\d): ', l)
    if m: cur = pmap[m.group(1)]; cur['modules'] = []; cur['mpList'] = []; continue
    if l.startswith('# 4.'): cur = None
    if not cur: continue
    if l == 'Related modules': mode = 'mod'; continue
    if l == 'Related macro processes': mode = 'mp'; continue
    if l == 'Works best with': mode = 'wb'; continue
    if not l.startswith('| '): continue
    c = cells(l)
    if c[0] == 'Target segment': cur['segmentDetail'] = c[1]
    elif c[0] == 'Suggested price': cur['priceDetail'] = c[1]
    elif c[0].startswith('Behavior'): cur['behavior'] = c[1]
    elif c[0].startswith('Pain'): cur['pain'] = c[1]
    elif c[0].startswith('Hope'): cur['hope'] = c[1]
    elif mode == 'mod' and c[0] != 'ID':
        for a, b in ((c[0], c[1]), (c[2], c[3])):
            if a: cur['modules'].append(a)
    elif mode == 'mp' and c[0].startswith('MP-'): cur['mpList'].append(c[0])
incl = {}
i = K.index('## 6.1  Pack Pricing')
for l in K[i:i+12]:
    if l.startswith('| PK-'):
        c = cells(l); inc = int(re.match(r'\d+', c[3]).group(0)); ov = float(re.search(r'[\d.]+', c[4]).group(0))
        pmap[c[0]]['includedUsers'] = inc; pmap[c[0]]['overage'] = ov
        pmap[c[0]]['unit'] = 'engagement' if 'engagement' in c[3] else 'external user' if 'external' in c[3] else 'user'
ints = []; cur = None
matrix = {}
i = K.index('## 4.0  Integration-to-Pack Matrix')
for l in K[i:i+25]:
    if l.startswith('| INT-'):
        c = cells(l); matrix[c[0]] = [('PK-0%d' % (j+1)) for j, x in enumerate(c[2:10]) if x == '●']
fam = None
for l in K:
    if re.match(r'## 4\.\d  ', l) and not l.startswith('## 4.0'): fam = l.split('  ', 1)[1]
    m = re.match(r'### (INT-[A-Z]+-\d\d): (.*)', l)
    if m: cur = {'id': m.group(1), 'name': m.group(2), 'family': fam, 'packs': matrix.get(m.group(1), [])}; ints.append(cur); continue
    if l.startswith('# 5.'): cur = None
    if cur and l.startswith('| '):
        c = cells(l)
        k = {'Goals': 'goals', 'Example applications': 'examples'}.get(c[0])
        if k: cur[k] = c[1]
        if c[0].startswith('Behavior'): cur['behavior'] = c[1]
        if c[0].startswith('Pain'): cur['pain'] = c[1]
        if c[0].startswith('Hope'): cur['hope'] = c[1]
ads = []; cur = None; amatrix = {}
i = K.index('## 5.0  Add-On-to-Pack Matrix')
for l in K[i:i+16]:
    if l.startswith('| AD-'):
        c = cells(l); amatrix[c[0]] = [('PK-0%d' % (j+1)) for j, x in enumerate(c[2:10]) if x == '●']
for l in K:
    m = re.match(r'### (AD-\d\d): (.*)', l)
    if m: cur = {'id': m.group(1), 'name': m.group(2), 'packs': amatrix.get(m.group(1), [])}; ads.append(cur); continue
    if l.startswith('# 6.'): cur = None
    if cur and l.startswith('| '):
        c = cells(l)
        if c[0] == 'Goals': cur['goals'] = c[1]
        if c[0] == 'Suggested price': cur['price'] = float(re.search(r'[\d.]+', c[1]).group(0))
        if c[0].startswith('Behavior'): cur['behavior'] = c[1]
        if c[0].startswith('Pain'): cur['pain'] = c[1]
        if c[0].startswith('Hope'): cur['hope'] = c[1]
bundles = []
i = K.index('## 6.4  Bundle Discounts (Optional)')
for l in K[i:i+10]:
    if l.startswith('| ') and not l.startswith('| Bundle'):
        c = cells(l); bundles.append({'name': c[0], 'packsText': c[1], 'discount': int(c[2].split('%')[0]), 'list': float(c[3].strip('$').replace(',', '')), 'price': float(c[4].strip('$').replace(',', ''))})
rules6 = []
i = K.index('## 6.3  Packaging Rules')
for l in K[i:i+12]:
    if l.startswith('| ') and not l.startswith('| Rule'):
        c = cells(l); rules6.append({'rule': c[0], 'description': c[1]})

# ---------- COSO classification of controls
def coso(r):
    t = (r['Control_Name'] + ' ' + r['Description']).lower()
    if any(w in t for w in ('review', 'monitor', 'audit trail', 'log', 'health', 'scan', 'test')): return 'Monitoring Activities'
    if any(w in t for w in ('notify', 'notification', 'disclosure', 'translat', 'language', 'communicat', 'dispatch')): return 'Information & Communication'
    if any(w in t for w in ('risk', 'forecast', 'predict')): return 'Risk Assessment'
    if any(w in t for w in ('segregation', 'accountable', 'approval', 'owner', 'governance', 'policy')): return 'Control Environment'
    return 'Control Activities'
controls = wb('D04_Controls')
for c in controls: c['COSO'] = coso(c)

cat_out = {
    'macroProcesses': mps, 'tasks': tasks, 'steps': stepList, 'e2e': e2es, 'composites': parsed['composites'], 'glossary': gl,
    'packs': packs, 'integrations': ints, 'addOns': ads, 'bundles': bundles, 'packagingRules': rules6,
    'rules': wb('D03_Business_Rules'), 'actions': wb('D03a_Actions_Registry'), 'controls': controls, 'risks': wb('D05_Risks'),
    'kpis': wb('D06_KPIs'), 'alerts': wb('D07_Alerts'), 'reports': wb('D08_Reports_Cockpits'), 'classes': wb('D09_Information_Class_Model'),
    'attributes': wb('D10_Data_Dictionary'), 'aiUseCases': wb('D15_AI_Use_Cases_Extended_'), 'roleMenus': wb('D15b_Role_Menus'),
    'modules': wb('D26_Modules_Tiers'),
}
json.dump(cat_out, open(OUT, 'w'), ensure_ascii=False, indent=0)
print({k: len(v) for k, v in cat_out.items()})

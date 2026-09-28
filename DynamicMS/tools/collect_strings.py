#!/usr/bin/env python3
"""Collect every translatable English string of the catalog into
tools/i18n/strings.en.txt (one per line, numbered). Translations live in
tools/i18n/strings.fr.txt and strings.ar.txt with the same numbering.
build_i18n.py then merges them into server/seed/catalog/i18n.json."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cat = json.load(open(os.path.join(ROOT, 'server/seed/catalog/catalog.en.json'), encoding='utf-8'))
S = []
seen = set()
_prev = os.path.join(ROOT, 'tools/i18n/strings.en.txt')
if os.path.exists(_prev):
    for line in open(_prev, encoding='utf-8'):
        n, t = line.rstrip('\n').split('\t', 1)
        S.append(t); seen.add(t)

def add(x):
    if x is None:
        return
    if isinstance(x, (list, tuple)):
        for y in x:
            add(y)
        return
    x = str(x).strip()
    if not x or x in seen:
        return
    if re.fullmatch(r'[\d\s.,%<>=\-–+$/x]+', x):
        return
    seen.add(x)
    S.append(x)

def roles(s):
    return [r.strip() for r in re.split(r';|,|->', s) if r.strip()]

for e in cat['e2e']:
    add([e['name'], e['goals'], e.get('trigger'), e.get('terminal'), e.get('description'), e.get('narrative'), e.get('businessValue')])
    add([m.strip() for m in e.get('modules', '').split(',')])
    for r in e.get('racsi', []):
        add(r['activity'])
        for k in 'RACSI':
            add(roles(r[k]))
    for f in e.get('flow', []):
        add([f['ufName'], f['goals'], f['seqTaskName'], f['stepName']])
        add(roles(f['inputSuppliers'])); add(roles(f['inputs'])); add(roles(f['outputs'])); add(roles(f['outputCustomers']))
for t in cat['e2eTypes']:
    add([t['type'], t['definition']])
for r in cat['relationTypes']:
    add([r['type'], r['definition']])
for e in cat['e2eWorkbook']:
    add(e['Owner_Role'])
for f in cat['functions']:
    add([f['Function_Name'], f['Description'], f['Function_Head_Role']])
for l in cat['processLevels']:
    add([l['Default_Name'], l['Tenant_Level_Name'], l['Rule']])
for s in cat['segments']:
    add(s['name']); add(s['risks']); add(s['audits'])
    add([k['name'] for k in s['kpis']])
    add([k['frequency'] for k in s['kpis']])
for m in cat['macroProcesses']:
    add([m['name'], m['goal'], m['objective'], m['ownerRole'], m['tier']])
    for k in 'SIPOC':
        add(m['sipoc'][k])
for st in cat['steps']:
    add([st['Task_Name'], st['Step_Name'], st['Step_Type'], st['Responsible_Role']])
    if 'Sequential task' not in st['Description']:
        add(st['Description'])
for u in cat['ufSteps']:
    add(u['name'])
for r in cat['businessRules']:
    add([r['Condition'], r['Rule_Type']])
for a in cat['actions']:
    add([a['Action_Name'], a['Action_Type'], a['Description']])
for c in cat['controls']:
    add([c['Control_Name'], c['Type'], c['Description']])
for r in cat['risks']:
    add([r['Risk_Name'], r['Category'], r['KRI_Formula']])
for k in cat['kpis']:
    add([k['KPI_Name'], k['Type'], k['Formula'], k['Target']])
for a in cat['alerts']:
    add([a['Severity']]); add(roles(a['Escalation_Path']))
for r in cat['reports']:
    add([r['Report_Name'], r['Refresh_Cadence']]); add(roles(r['Audience_Role']))
for t in cat['docTemplates']:
    add([t['Document_Type'], t['Versioning_Scheme'], t['Watermark_Rule']])
    add([x.strip() for x in t['Customizable_Elements'].split(';')])
    add([x.strip() for x in t['Mandatory_Sections'].split(';')])
    add([x.strip() for x in t['Lifecycle_States'].split('>')])
    add([x.strip() for x in t['Output_Formats'].split(';')])
for v in cat['docVersions']:
    add([v['Change_Summary'], v['Lifecycle_Status'], v['Author_Role'], v['Approver_Role'], v['Change_Type']])
for p in cat['policies']:
    add([p['Title'], p['Scope_Type'], p['Policy_Scope'], p['Commitments'], p['Owner'], p['Approver'], p['Lifecycle_Status']])
    add([x.strip() for x in p['Communication_Channels'].split(';')])
for c in cat['classes']:
    add([c['Description']])
for v in cat['valueLists']:
    add([v['List_Name'], v['Value_Label']])
for a in cat['aiUseCases']:
    add([a['Use_Case_Name'], a['Model_Task_Type'], a['Risk_Level'], a['Human_in_the_Loop_Checkpoint'], a['Activation_Scope'], a['Approval_Status']])
for r in cat['roleMenus']:
    add([r['Role_Name'], r['Menu_Section'], r['Menu_Item'], r['What_The_Role_Can_Do'], r['Access_Level'], r['Visibility_Condition']])
for m in cat['modules']:
    add([m['Module_Name'], m['Tier'], m['Licensing_Model'], m['Rate_Limit']])
for p in cat['packs']:
    add([p['name'], p['type'], p.get('valueProposition'), p.get('storage')])
    add([x.strip() for x in p.get('modules', '').split(',')])
for a in cat['addons']:
    add([a['name'], a['category'], a.get('goals'), a.get('valueProposition')])
for i in cat['integrations']:
    add([i['name'], i['category'], i.get('goals'), i.get('valueProposition'), i.get('examples')])
for d in cat['deploymentModes']:
    add([d['name'], d['description'], d['typical'], d.get('isolation'), d.get('residency')])
for c in cat['clusters']:
    add([c['name'], c['behavior'], c['pain'], c['hopes']])
for b in cat['agreements']:
    add([b['tier'], b['commitment']])
for b in cat['bundleDiscounts']:
    add(b['type'])
# Sample tenant (D00d, D01a-h, D02a-b, D09a)
for e in cat['sampleElements']:
    add([e['Element_Name'], e['Owner_Role'], e['Element_Type'], e['Level_Name']])
for s in cat['mpSheets']:
    for k in ['Inputs', 'Outputs', 'Goals', 'Human_Resources', 'Technical_IT_Infrastructure_Resources', 'Distribution_List']:
        add(s[k])
    for k in ['RACSI_Responsible', 'RACSI_Accountable', 'RACSI_Consulted', 'RACSI_Support', 'RACSI_Informed']:
        add(roles(s[k]))
for s in cat['sheetInteractions']:
    add([s['Interaction_Type'], s['Exchanged_Information']])
for s in cat['sheetTasks']:
    add([s['Task_Name'], s['Goals'], s['Brief_Description'], s['Detailed_Description']])
for s in cat['sheetKpis']:
    add([s['KPI_Name'], s['Formula'], s['Unit']])
    for k in ['RACSI_Responsible', 'RACSI_Accountable', 'RACSI_Consulted', 'RACSI_Support', 'RACSI_Informed']:
        add(roles(s[k]))
for s in cat['sheetSections']:
    add([s['Section_Title'], s['Content_Type'], s['Content']])
for s in cat['compositeSheets']:
    add([s['Composite_Name'], s['Grouping_Basis'], s['Aggregation_Rule']])
for s in cat['sipocRegister']:
    for k in ['Process_Element_Name', 'Element_Level', 'Trigger', 'Input_Suppliers', 'Inputs', 'Fine_Grained_Details', 'Outputs', 'Customers_Beneficiaries', 'End_Events', 'Go_No_Go_Criteria']:
        add(s[k])
for p in cat['procedures']:
    for k in ['Title', 'Goals', 'Scope_of_Work', 'Definitions', 'Main_External_Interactions', 'Main_Documents_and_Information', 'End_Events', 'Go_No_Go_Decisions', 'Reporting', 'Alerts']:
        add(p[k])
for p in cat['procedureSteps']:
    for k in ['Flow_Type', 'Step_Name', 'Who', 'Associated_Documents_Applications', 'Outputs', 'Customers_Beneficiaries', 'BPMN_Element', 'Go_No_Go_Criteria']:
        add(p[k])
for r in cat['referenceRegistry']:
    add([r['Item_Type'], r['Name'], r['Status']])
for t in cat['compliancePacks']:
    add(t['name'])

os.makedirs(os.path.join(ROOT, 'tools/i18n'), exist_ok=True)
with open(os.path.join(ROOT, 'tools/i18n/strings.en.txt'), 'w', encoding='utf-8') as f:
    for i, s in enumerate(S, 1):
        f.write(f'{i}\t{s}\n')
print(len(S), 'strings', sum(len(s) for s in S), 'chars')

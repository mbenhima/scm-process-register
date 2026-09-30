"""Builds "DynamicMS — IMS Document Templates": the suggested templates of the documented
information of an integrated management system (ISO 9001, ISO 14001, ISO 45001), their
sections and the project data that fills them, the mandatory documented information
matrix, how the templates are used in DynamicMS and the documents seeded with them."""
import json
import os
from brand import (new_document, cover, toc, page_break, para, bullets, numbered, table, callout, image)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')

SOURCES = {
    'policy_statement': 'Policy text validated in step MP-002.11 (AI-assisted draft, then edited), or the published policy.',
    'policy_statement_env': 'Environmental commitments built from the organization profile.',
    'policy_statement_ohs': 'OH&S commitments built from the organization profile.',
    'policy_commitments': 'Commitments recorded when consulting top management (step MP-002.3).',
    'scope': 'Scope statement, sites, non-applicable requirements and outsourced processes (step MP-001.8).',
    'obs_units': 'Sites and departments of the organization structure (OBS) with their members.',
    'standards': 'Standards selected once for the project (step MP-002.10).',
    'processes': 'Macro processes of the project with phase, owner and status.',
    'racsi': 'RACSI of every macro process (five columns, one Accountable).',
    'mp_racsi': 'RACSI of the macro process of the document.',
    'documents': 'Master list of the project documents: version, status, owner, next review.',
    'mandatory_matrix': 'Documented information required by the project standards and whether it exists.',
    'context_issues': 'Context register (external and internal issues).',
    'context_external': 'External issues recorded in step MP-001.2, one row per issue with its source.',
    'context_internal': 'Internal issues recorded in step MP-001.3, one row per issue with its source.',
    'parties': 'Interested parties and their needs and expectations (step MP-001.4 or the parties register).',
    'objectives': 'Objectives register filled by the SMART objectives step (MP-003.2): KPI, target, owner, deadline.',
    'obligations': 'Compliance obligations register with the evaluation of compliance.',
    'competence': 'Competence register: holder, level reached, level required, training date.',
    'training': 'Training sessions completed in the training steps with effectiveness.',
    'calibration': 'Monitoring and measuring equipment register with calibration dates.',
    'suppliers': 'Supplier register with score, last evaluation and status.',
    'reviews': 'Management reviews held with attendees and outputs.',
    'incidents': 'Incident register (near misses, first aid, environmental incidents).',
    'ideas': 'Improvement ideas with ROI, effort and status.',
    'risks': 'Risk register with likelihood, impact, score, residual risk, treatment and owner.',
    'risks_top': 'Risks scored 12 and above.',
    'opportunities': 'Opportunities of the risk register.',
    'aspects': 'Environmental aspects of the risk register.',
    'hazards': 'Hazards of the risk register.',
    'risk_scale': 'Likelihood and impact scale (1 to 5) and score bands.',
    'kpis': 'KPIs with target, last value and status (on target or not).',
    'mp_kpis': 'KPIs of the macro process of the document.',
    'kpi_values': 'Monthly values of the KPIs over the last six months.',
    'actions_objectives': 'Actions planned to reach the objectives.',
    'actions_corrective': 'Containment, corrective and preventive actions.',
    'actions_improvement': 'Improvement actions.',
    'actions_review': 'Actions decided in reviews.',
    'ncs': 'Nonconformities with source, criticality, root cause and stage.',
    'ncs_major': 'Major and critical nonconformities.',
    'audits': 'Audit programme: type, criteria, date, lead auditor, status.',
    'audits_done': 'Audits carried out.',
    'findings': 'Audit findings with clause, type and status.',
    'rex': 'Lessons learned (what went well, what did not, recommendation).',
    'controls': 'Controls with type, frequency, owner and effectiveness.',
    'rules': 'Business rules of the macro processes of the project.',
    'communications': 'Communication records typed in the communication steps (what, with whom, how, when, who).',
    'changes': 'Changes recorded in the change steps: what changed, why and who authorized it.',
    'revisions': 'Revision history of the document itself.',
    'mp_goal': 'Goal, trigger and terminal event of the macro process.',
    'mp_sipoc': 'SIPOC of the macro process.',
    'mp_steps': 'Tasks and steps of the macro process with role and status.',
    'phase_racsi': 'RACSI of the macro processes of the phase.',
    'phase_steps': 'Steps of the phase with role and status.',
    'phase_outputs': 'Outputs (records) of the macro processes of the phase.',
    'phase_kpis': 'KPIs of the macro processes of the phase.',
    'step_rows:MP-001.7': 'Process interactions recorded in step MP-001.7.',
    'step_matrix:MP-001.5': 'Decision matrix of the needs and expectations assessment (step MP-001.5).',
    'step_review:MP-001.10': 'Periodic review of the context (step MP-001.10): frequency, dates, decisions.',
}
TYPE = {'text': 'Text', 'data': 'Project data', 'signature': 'Approval block', 'step': 'Step value'}
KIND = {'maintain': 'Maintain (document)', 'retain': 'Retain (record)'}


def build():
    d = json.load(open(os.path.join(BUILD, 'templates.json'), encoding='utf8'))
    T = d['templates']
    doc = new_document('IMS Document Templates', 'DynamicMS — IMS Document Templates')
    cover(doc, 'Document templates', 'IMS Document Templates', 'ISO 9001 · ISO 14001 · ISO 45001 — suggested templates, their sections and the project data that fills them', 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)

    doc.add_heading('About this document', level=1)
    para(doc, f"POWERACT Consulting proposes {len(T)} templates for the documented information of an integrated management system. DynamicMS holds them as a library: each template lists its sections, and each section is either free text, an approval block, or a table or text filled from the project data (registers, step values, KPIs, risks, audits, nonconformities...). The application was seeded with these templates: {d['totals']['documents']:,} documents and {d['totals']['versions']:,} versions across {d['totals']['projects']} projects, ready to download in Word, PDF and Excel.")
    bullets(doc, [
        ('Formats. ', 'Word and PDF documents have a cover page and a table of contents, except the policies (one page, no table of contents). Excel workbooks have a cover sheet and one sheet per table.'),
        ('Layout. ', 'The logo, colors, header and footer of the organization (Records › Documents › Layout) apply to every generated file, like a Word template.'),
        ('Versions. ', 'A document starts as a draft (0.1), goes to review, and is published by a person other than the author. A new version is either regenerated from the current project data or copied, then edited.'),
        ('Tenant templates. ', 'An organization copies a library template to adapt its sections and texts, or creates a new template; its copy replaces the library template in its own library.'),
    ])

    doc.add_heading('Documented information required by the standards', level=1)
    para(doc, 'ISO standards distinguish documented information to maintain (a document kept up to date) and documented information to retain (a record kept as evidence). The matrix lists what each standard requires and the template that answers it.')
    for std in ['ISO 9001', 'ISO 14001', 'ISO 45001']:
        doc.add_heading(std, level=2)
        rows = [[t['clauses'].get(std, ''), t['name'], KIND[t['mandatory'][std]], t['code']] for t in T if std in t['mandatory']]
        rows.sort(key=lambda r: [int(x) if x.isdigit() else 0 for x in r[0].replace(',', '.').split('.')[:3]])
        table(doc, ['Clause', 'Documented information', 'Maintain / retain', 'Template'], rows, [2.2, 9.0, 3.6, 3.2], size=9.5)
    callout(doc, 'ISO 9001 §8.3 (design and development records) is not applicable to organizations that do not design their products or services; the exclusion is justified in the scope of the management system (template TPL-SCOPE).', 'Note.')

    doc.add_heading('Template catalogue', level=1)
    para(doc, 'Templates are grouped by category. For each one: purpose, formats, requirements answered, review frequency, owner, the macro process that produces it, and its sections with the data that fills them.')
    for cat in d['categories']:
        items = [t for t in T if t['category'] == cat['id']]
        if not items:
            continue
        doc.add_heading(cat['name'], level=2)
        table(doc, ['Code', 'Template', 'Management system', 'Formats', 'Required by'],
              [[t['code'], t['name'], ', '.join(t['ms']), ', '.join(t['formats']), '; '.join(f"{s} §{t['clauses'].get(s, '')} ({'maintain' if k == 'maintain' else 'retain'})" for s, k in t['mandatory'].items()) or 'Recommended'] for t in items],
              [2.6, 5.6, 2.6, 2.6, 4.6], size=9)
        for t in items:
            doc.add_heading(f"{t['code']} — {t['name']}", level=3)
            para(doc, t['description'])
            meta = [f"Formats: {', '.join(t['formats'])}", f"table of contents: {'yes' if t['toc'] else 'no'}", f"review: {t['review']}", f"owner: {t['owner'].replace('_', ' ').title()}", f"produced by: {t['mpName'] or '—'}"]
            if t['perMp']:
                meta.append('one document per macro process')
            if t['perPhase']:
                meta.append('one document per end-to-end phase')
            if t['alternativeTo']:
                meta.append(f"replaced by {t['alternativeTo']} when an integrated policy is used")
            para(doc, '; '.join(meta) + '.', size=10)
            table(doc, ['#', 'Section', 'Type', 'Content'], [[str(i + 1), s['title'], TYPE.get(s['type'], s['type']),
                   (SOURCES.get(s['source'], s['source']) if s['source'] else (s['text'] or 'Names, dates and signatures of the persons who prepared, reviewed and approved the document.' if s['type'] == 'signature' else s['text'] or ''))] for i, s in enumerate(t['sections'])],
                  [0.8, 4.4, 2.6, 10.2], size=9)

    doc.add_heading('Data that fills the templates', level=1)
    para(doc, 'Each data section of a template names a data source. The table explains where the data comes from in DynamicMS, so the documents stay consistent with what the teams record in the workflow steps and registers.')
    used = sorted({s['source'] for t in T for s in t['sections'] if s['source']})
    table(doc, ['Source', 'Content and origin'], [[u, SOURCES.get(u, '')] for u in used], [5.2, 12.8], size=9.5)
    para(doc, 'Placeholders in free text: {org} organization, {product} products and services, {line} main delivery process, {city} site, {customer} main customers, {supplier} main supplies, {standards} standards of the project, {date} date of generation, {phase} end-to-end phase of a procedure.', size=10)

    doc.add_heading('Using the templates in DynamicMS', level=1)
    doc.add_heading('Generate a document', level=2)
    numbered(doc, [
        'From a workflow step: select Generate document, choose a template (the templates of the macro process are suggested first), then Generate. The draft is linked to the step and appears under Documents of this step.',
        'From Records › Documents: select New document, choose From a template, filled with the project data, and the template.',
        'From Records › Documents › Required by the standards: select Create next to a missing document.',
    ])
    doc.add_heading('Review, approve and download', level=2)
    numbered(doc, [
        'Open the document: the Structure and content card shows each section with its data.',
        'On a draft, select Edit the structure to add, rename, reorder or delete sections and to edit free text.',
        'Select Submit for review; another person selects Approve and publish. The previous version becomes Superseded.',
        'Select PDF, DOCX or XLSX to download the version shown. A draft is marked UNCONTROLLED DRAFT.',
        'For the next revision, select New version and choose Regenerate the content from the current project data, or keep the current content.',
    ])
    doc.add_heading('Adapt the templates', level=2)
    numbered(doc, [
        'Open Records › Documents › Templates and select a template to see its structure.',
        'Select Copy to edit: the copy belongs to your organization and replaces the library template in your library.',
        'Rename, add, reorder or delete sections; choose for each section free text, project data (and which data) or an approval block; choose the formats and whether the Word and PDF files have a table of contents.',
        'Select New template to create a template from scratch; Retire removes a template of your organization.',
        'Open the Layout tab to set the logo, colors, header and footer of every generated file.',
    ])

    doc.add_heading('Documents seeded in the demonstration', level=1)
    para(doc, 'Every project of the demonstration has its documents generated from the templates that apply to its management system and standards. The scenario projects of the user guides keep a frozen copy of the content of each current version; the others are rendered from the live data when downloaded.')
    for p in d['projects']:
        doc.add_heading(f"{p['code']} — {p['name']}", level=2)
        para(doc, f"Standards: {', '.join(p['standards'])}. {len(p['documents'])} documents.", size=10)
        table(doc, ['Code', 'Title', 'Template', 'Version', 'Status'], [[x['code'], x['title'], x['template_id'] or '—', x['current_version'], x['status']] for x in p['documents']], [4.6, 7.6, 2.6, 1.4, 1.8], size=8.5)

    doc.add_heading('Appendix — Sample pages', level=1)
    para(doc, 'Pages of documents generated for Atlas Universal SME (project AT-UNI-QMS), as downloaded in PDF with the default layout.')
    pages = os.path.join(BUILD, 'sample-pages')
    for f, cap in [('POL-Q-p1', 'Quality policy — cover page'), ('POL-Q-p2', 'Quality policy — statement, commitments and approval (no table of contents)'),
                   ('CTX-p2', 'Context and interested parties analysis — table of contents'), ('CTX-p3', 'Context and interested parties analysis — issues with their sources'),
                   ('SCOPE-p3', 'Scope of the management system'), ('OBJ-p2', 'Objectives and action plan'), ('RACSI-p2', 'RACSI matrix'), ('MR-p3', 'Management review minutes')]:
        pth = os.path.join(pages, f + '.png')
        if os.path.exists(pth):
            image(doc, pth, 12, f'Figure — {cap}.')
    path = os.path.join(OUT, 'DynamicMS_IMS_Document_Templates.docx')
    doc.save(path)
    print('saved', path)


if __name__ == '__main__':
    build()

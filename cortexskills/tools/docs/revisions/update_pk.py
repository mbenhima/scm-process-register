# Packs, Integrations & Add-Ons: version 2.0 -> 3.0, aligned with CortexSkills 1.15.0.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ox import *
from xml.sax.saxutils import escape as E

d = Doc(sys.argv[1])
T = lambda old, new, n=1: d.sub1(E(old), E(new), n)

# ---- cover, revision history, executive summary
T('Version 2.0  ·  28 September 2026', 'Version 3.0  ·  16 October 2026')
d.add_row('No base price change.', [
    '3.0', '16 October 2026',
    'Aligned with CortexSkills release 1.15.0: SME packs (6.5), compliance and security standards (6.6), entitlements, quotas '
    'and AI tiers per offer (6.7), deployment, licensing and customer edition (6.8). AD-11 channels updated to Face-to-Face, '
    'Email, WhatsApp, Application and Combination; bundle user terms stated. No change to pack, add-on or bundle prices.'])
d.insert_after('What is new in version 2.0', spacer() + callout(
    'What is new in version 3.0',
    'Version 3.0 aligns the catalog with CortexSkills release 1.15.0. It adds the three SME packs, the compliance and security '
    'standards, the quotas and AI tier of each offer, and the licensing rules of private-cloud and on-premises installations, where '
    'the plan, the users and the add-ons come from a licence signed by POWERACT. Pack, add-on and bundle prices are unchanged.'), which='tbl')
T('Prices, user limits, overage, packaging rules and bundle discounts.',
  'Prices, user limits, overage, packaging rules, bundle discounts, SME packs, compliance standards, entitlements and licensing.')

# ---- AD-11 and questionnaire notes: the channels of the application
T('with multi-channel distribution (Face-to-Face, Email, Hybrid, Custom)',
  'with multi-channel distribution (Face-to-Face, Email, WhatsApp, Application, or a Combination played in sequence)') if E('with multi-channel distribution (Face-to-Face, Email, Hybrid, Custom)') in d.x else \
    T('(Face-to-Face, Email, Hybrid, Custom)', '(Face-to-Face, Email, WhatsApp, Application, or a Combination played in sequence)')
T('Add-On AD-11 removes the limit and adds custom channel support on any Pack.', 'Add-On AD-11 removes the limit on any Pack.')
T('extends questionnaire volume and custom channel support to any Pack.', 'removes the monthly questionnaire limit on any Pack.')

# ---- bundles: user terms
d.insert_after('Table 6.4 — Bundle discounts.', para(
    'Each bundle includes 500 users, with $0.45 per additional user per month. The Full Suite opens every module of the platform.'))

# ---- new sections 6.5 to 6.8, before Section 7
S = []
S += [h(2, '6.5  SME Packs'),
      para('Three packs priced for small and medium enterprises combine packs at a single price. They run the SME tracks of the application '
           '(Essential, Standard, Advanced), with fewer gates and a shorter duration than the full Training Engineering cycle.'),
      table(['ID', 'SME pack', 'Contents', 'Price (USD/month)', 'Included users', 'Overage', 'Segment'], [
          ['SME-ESS', 'SME Essentials Pack', 'PK-01 + AD-11', '$49', '25', '$1.20 per user', 'Micro, Small'],
          ['SME-GRO', 'SME Growth Pack', 'PK-01, PK-02, PK-03', '$129', '50', '$1.00 per user', 'Small, Medium'],
          ['SME-CMP', 'SME Complete Pack', 'PK-01 to PK-08 (every module)', '$249', '100', '$0.90 per user', 'Medium'],
      ], [1150, 1850, 1996, 1300, 1100, 1300, 1050]),
      caption('Table 6.5 — SME packs. Prices respect the $40 minimum; a minimum of 5 users applies.')]
S += [h(2, '6.6  Compliance & Security Standards'),
      para('Compliance and security standards are switched on one by one, independently of the pack (module M52). Switching a standard on '
           'requires accepting its disclosure and adds its controls to the organization’s control register, each mapped to a COSO component. '
           'Standards are priced per standard on quotation; they are not part of the price list.'),
      table(['Standard', 'Controls added', 'Examples'], [
          ['GDPR', '4', 'Records of processing activities; data-subject rights; breach notification within 72 hours; impact assessment'],
          ['ISO/IEC 27001', '4', 'Information security policy; access control review; supplier security; security risk assessment'],
          ['SOC 2', '4', 'Change management; logical access; system monitoring; incident communication'],
          ['ISO/IEC 27701', '2', 'Privacy information management roles; privacy by design'],
          ['ISO 9001', '3', 'Competence and awareness (clause 7.2); internal audit programme; corrective action'],
          ['Law 09-08 (CNDP, Morocco)', '3', 'Prior declaration to the CNDP; consent of data subjects; cross-border transfer authorisation'],
      ], [2600, 1400, 5746]),
      caption('Table 6.6 — Compliance and security standards available in the application.')]
S += [h(2, '6.7  Entitlements, Quotas & AI Tiers'),
      para('The offer an organization subscribes to decides the modules it can open, its quotas and its AI tier. The Platform Shell (M00) '
           'and the Configuration & Licensing Console (M51) are included in every offer. A creation beyond a quota is refused with a message '
           'naming the limit.'),
      table(['Offer', 'Projects', 'OBS nodes', 'Custom AI use cases', 'Questionnaires / month', 'AI tier'], [
          ['PK-01, PK-02, PK-04, PK-05, PK-06', '25', '200', '5', '100', 'Assistive'],
          ['PK-03, PK-08', '25', '200', '5', '100', 'Assistive + Augmented'],
          ['PK-07', '50', '200', '5', '100', 'Assistive + Augmented'],
          ['Starter Bundle', '100', '1,000', '20', '100', 'Assistive'],
          ['Growth, Enterprise and Strategic Bundles', '100', '1,000', '20', '100', 'Assistive + Augmented'],
          ['Full Suite', '200', '1,000', '20', '100', 'Assistive + Augmented'],
          ['SME-ESS', '5', '60', '3', '100', 'Assistive'],
          ['SME-GRO', '20', '60', '3', '100', 'Assistive + Augmented'],
          ['SME-CMP', '20', '60', '10', '100', 'Assistive + Augmented'],
      ], [3046, 1000, 1100, 1500, 1500, 1600]),
      caption('Table 6.7 — Quotas and AI tier per offer. AD-11 removes the questionnaire limit; the number of users is set by the licence.'),
      bullet([('Assistive: ', True), ('AI proposes content — questions, step entries, report sections — that a person reviews and validates before it is saved.', False)]),
      bullet([('Assistive + Augmented: ', True), ('also opens the AI use cases classed Augmented, which analyse the organization’s data; their results are validated by a person in the same way. No AI use case acts autonomously.', False)]),
      bullet([('Platform limits (every offer): ', True), ('600 API requests per minute and 100 concurrent users per organization; 30 AI Assistant questions per minute per user.', False)])]
S += [h(2, '6.8  Deployment, Licensing & Customer Edition'),
      table(['Topic', 'Rule'], [
          ['Deployment models', 'Private cloud or on-premises: the customer runs the CortexSkills package (Docker) on its own server. SaaS is not offered at this stage.'],
          ['Licence', 'A licence file signed by POWERACT and bound to the customer’s organization. It carries the offer (pack, bundle or SME pack), the maximum number of users, the add-ons and the end date.'],
          ['Changes', 'In an installation, the offer, the users and the add-ons cannot be changed locally. An upgrade, a renewal or an extra add-on is a new licence version issued by POWERACT and installed by the customer.'],
          ['End date and revocation', 'After the end date the installation switches to read-only until a renewed licence is installed. A licence revoked by POWERACT (for example on contract termination) is removed from the installation.'],
          ['Customer edition', 'The package delivered to customers shows no price and no commercial information: no price list, no quotation screen, no price in the catalog. The runtime is delivered without source code.'],
          ['Quotation (POWERACT)', 'Monthly total = base price + (users beyond the included users × overage price). Bundles: list price minus the bundle discount.'],
      ], [2600, 7146]),
      caption('Table 6.8 — Deployment and licensing rules.')]
d.insert_after('Each bundle includes 500 users', ''.join(S))

# ---- strategic conclusion
d.insert_after('removes the monthly questionnaire limit on any Pack.', bullet([
    ('Three SME packs ', True), ('from $49 per month bring the Training Engineering cycle to micro, small and medium enterprises.', False)]) + bullet([
    ('Private-cloud and on-premises installations ', True), ('run under a licence signed by POWERACT, with a customer edition free of prices and source code.', False)]))

# stray footer text left in the body of version 2.0
i = d.x.find('<w:t>Confidential  ·  Page  of</w:t>')
if i > 0:
    a = d.x.rfind('<w:p>', 0, i); b = d.x.find('</w:p>', i) + 6; d.x = d.x[:a] + d.x[b:]

d.add_toc([(1, '6.5 SME Packs'), (1, '6.6 Compliance & Security Standards'), (1, '6.7 Entitlements, Quotas & AI Tiers'),
           (1, '6.8 Deployment, Licensing & Customer Edition')], before='7. Strategic Conclusion')
d.save()
print('ok')

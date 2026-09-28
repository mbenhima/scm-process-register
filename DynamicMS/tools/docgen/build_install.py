"""Builds the DynamicMS installation guide (Word, with TOC)."""
import os
from brand import new_document, cover, toc, page_break, para, bullets, numbered, table, callout

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'deliverables', 'DynamicMS_Installation_Guide.docx')


def code_block(doc, lines):
    table(doc, ['Command'], [[l] for l in lines], [18], size=10)


def main():
    doc = new_document('DynamicMS — Installation Guide', 'DynamicMS — Installation Guide')
    cover(doc, 'Installation guide', 'DynamicMS — Installation Guide', 'Server and web client, demonstration data in English, French and Arabic', 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)

    doc.add_heading('What you install', level=1)
    para(doc, 'POWERACT Consulting delivers DynamicMS as one zip file with two folders. Installation needs only Node.js: the database is the SQLite engine built into Node.js, so no database server, compiler or container is required.')
    table(doc, ['Folder', 'Content', 'Port'], [
        ['server', 'REST API (Node.js, Express), SQLite database, seed generator, reports (PDF, Excel, Word, CSV), backups, licence tools, tests.', '4000'],
        ['web', 'Web client (React, Vite). In development it proxies /api to the server; built, it is served by the server.', '5173'],
    ], [3, 12, 3], size=10, bold_first=True)
    doc.add_heading('Requirements', level=2)
    table(doc, ['Item', 'Minimum'], [
        ['Operating system', 'Windows 10/11, macOS 13 or later, or a recent Linux distribution'],
        ['Node.js', 'Version 22.13 or later (LTS 22 or 24). The built-in node:sqlite module is required.'],
        ['npm', 'Installed with Node.js'],
        ['Disk space', '1.5 GB (dependencies about 400 MB, demonstration database about 190 MB, backups)'],
        ['Memory', '2 GB free'],
        ['Browser', 'Current Chrome, Edge, Firefox or Safari (desktop, tablet or mobile)'],
        ['Network', 'Internet access for npm install only; the application itself runs offline'],
    ], [5, 13], size=10, bold_first=True)

    doc.add_heading('Install Node.js', level=1)
    bullets(doc, [
        ('Windows and macOS. ', 'Download the LTS installer from nodejs.org, run it with the default options, then open a new terminal.'),
        ('Linux. ', 'Use the NodeSource packages or nvm, for example: nvm install 22.'),
        ('Check. ', 'Type node --version. The result must be v22.13.0 or later.'),
    ])

    doc.add_heading('Install and start the application', level=1)
    doc.add_heading('1. Unzip', level=2)
    para(doc, 'Unzip DynamicMS.zip into a folder of your choice, for example C:\\DynamicMS or ~/DynamicMS. You obtain the folders server and web.')
    doc.add_heading('2. Server: install, seed, start', level=2)
    para(doc, 'Open a terminal in the server folder and type:')
    code_block(doc, ['cd server', 'npm install', 'npm run seed', 'npm run dev'])
    bullets(doc, [
        ('npm install ', 'downloads the server dependencies (about one minute).'),
        ('npm run seed ', 'creates data/dynamicms.db with the full demonstration: 2 groups and 1 independent organization, 60 organizations, 120 full-run projects (QMS and QHSE for each vertical, large companies and SMEs), 1,141 users and every record of the runs, in English, French and Arabic. It takes 10 to 30 seconds and can be run again at any time to reset the data.'),
        ('npm run dev ', 'starts the API on http://localhost:4000 and restarts it when the code changes. Check http://localhost:4000/api/health: it returns status ok.'),
    ])
    doc.add_heading('3. Web client: install and start', level=2)
    para(doc, 'Open a second terminal in the web folder and type:')
    code_block(doc, ['cd web', 'npm install', 'npm run dev'])
    para(doc, 'Open http://localhost:5173 in your browser. Keep both terminals open while you use the application.')
    doc.add_heading('4. Sign in', level=2)
    table(doc, ['Account', 'E-mail', 'Password'], [
        ['Platform administrator', 'admin@dynamicms.example', 'Admin@2026'],
        ['Universal large company — Quality Manager', 'quality@horizon-universal.example', 'Demo@2026'],
        ['Universal large company — IMS Manager', 'ims@horizon-universal.example', 'Demo@2026'],
        ['Universal SME — IMS Manager', 'ims@atlas-sme.example', 'Demo@2026'],
        ['AEC & Construction SME — Quality Manager', 'quality@nova-aec.example', 'Demo@2026'],
        ['Group top management (automotive)', 'ceo@horizon-aut.example', 'Demo@2026'],
    ], [6.5, 7.5, 4], size=10)
    para(doc, 'Every organization has 19 accounts named role@domain: ims, quality, hse, risk, compliance, audit, hr, documents, it, operations, performance, esg, transformation, process, admin, ceo, employee, aigov and auditor. Large companies use horizon-<vertical>.example (for example horizon-aec.example), SMEs nova-<vertical>.example, the universal holding horizon-universal.example and the independent SME atlas-sme.example.')

    doc.add_heading('Configuration', level=1)
    para(doc, 'The server reads the following environment variables. Defaults suit a local installation.')
    table(doc, ['Variable', 'Default', 'Purpose'], [
        ['PORT', '4000', 'API port'],
        ['DB_FILE', 'server/data/dynamicms.db', 'SQLite database file'],
        ['JWT_SECRET', 'development value', 'Signing key of sessions. Mandatory in production: the server refuses to start with the default.'],
        ['JWT_TTL', '12h', 'Session duration'],
        ['CORS_ORIGIN', 'http://localhost:5173', 'Origins allowed to call the API (comma-separated)'],
        ['BACKUP_DIR', 'server/backups', 'Backup folder'],
        ['BACKUP_RETENTION_DAYS', '14', 'Backups older than this are deleted'],
        ['STORAGE_DIR', 'server/storage', 'Attached files'],
        ['DEPLOYMENT_MODE', 'saas', 'saas or onprem (on-premises requires a signed licence)'],
        ['LICENCE_FILE', 'server/licence/licence.lic', 'Licence file for on-premises mode'],
    ], [4.2, 4.6, 9.2], size=9.5, bold_first=True)

    doc.add_heading('Production deployment', level=1)
    numbered(doc, ['Build the web client: in the web folder type npm run build (creates web/dist).', 'In the server folder, set JWT_SECRET to a long random value and NODE_ENV=production.', 'Start the server with npm start. It serves the API and the built web client on the same port (http://<host>:4000).', 'Place a reverse proxy (IIS, nginx, Apache) with TLS in front of port 4000 for access over the network.'])
    code_block(doc, ['cd web && npm run build', 'cd ../server', 'set JWT_SECRET=<long random value>   (Windows)  |  export JWT_SECRET=<long random value>   (macOS, Linux)', 'set NODE_ENV=production                |  export NODE_ENV=production', 'npm start'])

    doc.add_heading('Backups and restore', level=1)
    para(doc, 'The server takes a consistent backup when it starts (if the last one is older than a day) and then every 24 hours, and deletes backups older than the retention period. You can also back up on demand:')
    code_block(doc, ['npm run backup', 'npm run backup -- --list', 'npm run backup -- --verify dynamicms-<date>-cli.db'])
    para(doc, 'To restore: stop the server, copy the chosen backup file over server/data/dynamicms.db, then start the server again. The platform administrator can also back up from Administration › Operations.')

    doc.add_heading('On-premises licence', level=1)
    para(doc, 'In on-premises mode the server checks a licence file signed with an Ed25519 key: customer, number of seats, expiry date and packs. Without a valid licence the platform stays readable but refuses changes.')
    code_block(doc, ['npm run sign-licence -- --customer "Horizon Industrial Group" --seats 1500 --expires 2027-12-31 --packs DMS-ENT,DMS-AI', 'set DEPLOYMENT_MODE=onprem   (Windows)  |  export DEPLOYMENT_MODE=onprem', 'npm start'])
    callout(doc, 'The first signing creates the key pair in server/licence. Keep private.pem with the vendor; the customer server needs only public.pem and licence.lic.', 'Security.')

    doc.add_heading('Automated tests', level=1)
    para(doc, 'In the server folder, npm test runs the API test suite on a copy of the seeded database: sign-in, full-run step completion and reopen, gate rules, cross-tenant isolation, RBAC, one-Accountable RACSI rule, owner-evaluator separation, report exports in three languages and four formats, AI suggestions, benchmarking, project creation modes, permission matrix, compliance disclosure and backups.')
    code_block(doc, ['cd server', 'npm test'])

    doc.add_heading('Troubleshooting', level=1)
    table(doc, ['Message or symptom', 'Cause and remedy'], [
        ['“The database is empty. Run npm run seed first”', 'Run npm run seed in the server folder, then npm run dev.'],
        ['“Cannot find module node:sqlite” or “No such built-in module”', 'Node.js is older than 22.13. Install the current LTS and open a new terminal.'],
        ['“EADDRINUSE: port 4000 (or 5173) already in use”', 'Another program uses the port. Stop it, or start the server with PORT=4100 and update the proxy in web/vite.config.js.'],
        ['The web page shows “Something went wrong” after sign-in', 'The server is not running. Start it with npm run dev in the server folder.'],
        ['npm install fails behind a company proxy', 'Configure npm: npm config set proxy http://proxy:port and npm config set https-proxy http://proxy:port.'],
        ['You want to start again with clean demonstration data', 'Stop the server, run npm run seed, start the server.'],
    ], [7, 11], size=10, bold_first=True)
    doc.save(OUT)
    print('saved', OUT)


if __name__ == '__main__':
    main()

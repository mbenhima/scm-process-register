"""Builds the CortexPLM Installation Guide (.docx). Run: python3 build_install_guide.py <out.docx>"""
import sys
from docstyle import new_document, header_footer, cover, toc, h1, para, bullets, numbered, table, callout

ORGS = [
    ('Public Sector', 'Metro City Digital Services Agency', 'metrocity.example'),
    ('Manufacturing in Construction', 'Cedarline Precast Systems', 'cedarline.example'),
    ('Healthcare', 'Meridale Health Network', 'meridale.example'),
    ('Agro-Business – Dairy Products', 'Valdora Dairy Cooperative', 'valdora.example'),
    ('Transportation', 'Orvane Transit Group', 'orvane.example'),
    ('Oil, Gas & Energy', 'Kestrel Energy & Utilities', 'kestrel.example'),
    ('Construction', 'Ridgeway Construction Contractors', 'ridgeway.example'),
]
GROUP_OF = {'cedarline.example': 'Atlas Infrastructure Holding', 'orvane.example': 'Atlas Infrastructure Holding', 'ridgeway.example': 'Atlas Infrastructure Holding',
            'valdora.example': 'Crescent Agro-Energy Group', 'kestrel.example': 'Crescent Agro-Energy Group'}
ROLES = [
    ('exec', 'Executive Sponsor (records gate decisions)'), ('board1', 'Gate Review Board member'), ('pm1', 'Product Manager (runs projects)'),
    ('pm2', 'Product Manager (French or Arabic interface in two organizations)'), ('portfolio', 'Portfolio Manager'), ('engineering', 'Engineering Lead'),
    ('quality', 'Quality Manager'), ('compliance', 'Regulatory & Compliance Officer'), ('finance', 'Finance Controller'), ('marketing', 'Marketing & Sales Manager'),
    ('process', 'Process Owner / Track Administrator'), ('admin', 'Organization administrator'), ('auditor', 'Internal Auditor (read-only)'),
    ('supplier', 'Supplier (external portal)'), ('customer', 'Customer (external portal)'),
]


def build(out):
    doc = new_document('CortexPLM Installation Guide')
    cover(doc, 'Installation Guide', 'CortexPLM', 'Install, start and sign in, step by step', 'Version 1.0  ·  September 2026')
    header_footer(doc, 'CortexPLM Installation Guide')
    toc(doc)

    h1(doc, '1. Before You Start', new_page=False)
    para(doc, 'This guide installs CortexPLM on one computer so you can use it in a web browser. You do not need programming skills. '
         'Every command is given exactly as you type it. The whole installation takes about 15 minutes.')
    doc.add_heading('1.1 What you need', 2)
    table(doc, ['Item', 'Requirement'], [
        ('Computer', 'Windows 10 or 11, macOS 12 or newer, or Linux'),
        ('Free disk space', 'About 1 GB'),
        ('Memory', '4 GB or more'),
        ('Web browser', 'Google Chrome, Microsoft Edge or Mozilla Firefox (recent version)'),
        ('Internet', 'Needed once, during installation, to download components'),
        ('Node.js', 'Version 22.13 or newer (the LTS version from nodejs.org). Section 2 shows how to install it.'),
        ('Application file', 'CortexPLM_Application.zip'),
    ], widths=[1.8, 4.97])
    doc.add_heading('1.2 What is in the zip file', 2)
    table(doc, ['Folder', 'What it is'], [
        ('server', 'The application engine and its database. It runs in a first window.'),
        ('web', 'The screens you use in the browser. It runs in a second window.'),
        ('README.md', 'A one-page summary of the commands.'),
    ], widths=[1.4, 5.37])
    callout(doc, 'You will keep **two black command windows** open while you use CortexPLM: one for **server** and one for **web**. Closing a window stops that part.', 'Good to know')

    h1(doc, '2. Install Node.js', new_page=False)
    para(doc, 'Node.js is the free engine that runs CortexPLM. Install it once.')
    numbered(doc, [
        'Open your browser and go to **https://nodejs.org**.',
        'Download the version marked **LTS** (22 or newer).',
        'Open the downloaded file and follow the installer. Keep the default choices and select **Next** until **Finish**.',
        'Check the installation. Open a command window (see Section 3.2), type **node -v** and press **Enter**. You should see a version such as **v22.13.0** or higher (for example **v24.11.0**).',
    ])
    callout(doc, 'If the command window says that "node" is not recognized, close all command windows, open a new one and try again. If it still fails, restart the computer.', 'Tip')

    h1(doc, '3. Unzip the Application', new_page=False)
    doc.add_heading('3.1 Extract the files', 2)
    numbered(doc, [
        'Create a folder for the application, for example **Documents\\CortexPLM**.',
        'Copy **CortexPLM_Application.zip** into that folder.',
        'Windows: right-click the file and select **Extract All**, then **Extract**. macOS: double-click the file.',
        'Open the extracted folder. You should see the folders **server** and **web**.',
    ])
    doc.add_heading('3.2 Open a command window in a folder', 2)
    table(doc, ['System', 'How to open a command window inside a folder'], [
        ('Windows', 'Open the folder in File Explorer. Click the address bar at the top, type **cmd** and press **Enter**.'),
        ('macOS', 'Open Terminal (Applications > Utilities > Terminal). Type **cd** followed by a space, drag the folder onto the Terminal window and press **Enter**.'),
        ('Linux', 'Right-click inside the folder and select **Open in Terminal**.'),
    ], widths=[1.2, 5.57])

    h1(doc, '4. Start the Server (first window)', new_page=False)
    para(doc, 'Open a command window in the **server** folder, then type these three commands, one at a time. Press **Enter** after each and wait until it finishes.')
    table(doc, ['Step', 'Type this', 'What happens', 'How long'], [
        ('1', '**npm install**', 'Downloads the components the server needs.', '1 to 3 minutes'),
        ('2', '**npm run seed**', 'Creates the database with seven demonstration organizations (one per sector), 147 projects and their history. It ends with "Done".', 'About 1 minute'),
        ('3', '**npm run dev**', 'Starts the server. It shows "CortexPLM API is running on http://localhost:4000".', 'A few seconds'),
    ], widths=[0.6, 1.5, 3.6, 1.07])
    callout(doc, 'Leave this window open. The server stops when the window closes.', 'Important')
    callout(doc, '**npm run seed** erases the database and recreates the demonstration data. Run it only the first time, or when you want to start again from a clean demonstration.', 'Warning')

    h1(doc, '5. Start the Web Application (second window)', new_page=False)
    para(doc, 'Open a second command window, this time in the **web** folder, and type:')
    table(doc, ['Step', 'Type this', 'What happens', 'How long'], [
        ('1', '**npm install**', 'Downloads the components of the screens.', '1 to 3 minutes'),
        ('2', '**npm run dev**', 'Starts the web application. It shows "Local: http://localhost:5173/".', 'A few seconds'),
    ], widths=[0.6, 1.5, 3.6, 1.07])

    h1(doc, '6. Open CortexPLM and Sign In', new_page=False)
    numbered(doc, [
        'Open your browser and go to **http://localhost:5173**.',
        'Type an e-mail address and a password from the tables below, then select **Sign in**.',
        'The dashboard of the organization opens.',
    ])
    doc.add_heading('6.1 Platform administrator', 2)
    table(doc, ['E-mail', 'Password', 'Can do'], [('**admin@cortexplm.example**', '**Admin#2026**', 'Everything, in every organization. Switch organization from the top bar.')], widths=[2.4, 1.2, 3.17])
    doc.add_heading('6.2 Demonstration organizations', 2)
    para(doc, 'Every organization has the same set of users. Build the e-mail address from a user name and the organization domain, for example **pm1@metrocity.example**. The password is always **Demo#2026**.')
    table(doc, ['Sector', 'Organization', 'Domain', 'Group'], [(a, b, f'**{c}**', GROUP_OF.get(c, 'Independent')) for a, b, c in ORGS], widths=[1.75, 2.2, 1.35, 1.47], size=9.5)
    para(doc, 'Organizations of the same group can compare their indicators in **Reports > Benchmarking**. Independent organizations compare only their own projects.')
    doc.add_heading('6.3 User names and roles', 2)
    table(doc, ['User name', 'Role in the application'], [(f'**{a}**', b) for a, b in ROLES], widths=[1.4, 5.37])
    callout(doc, 'The licence of Orvane Transit Group expires in 22 days. A yellow banner shows this on purpose, to demonstrate the licence warning.', 'Note')

    h1(doc, '7. Stop and Start Again', new_page=False)
    doc.add_heading('7.1 Stop the application', 2)
    para(doc, 'In each command window, press **Ctrl + C** (on macOS as well). If asked "Terminate batch job?", type **Y** and press **Enter**. Then close the windows.')
    doc.add_heading('7.2 Start the application the next time', 2)
    para(doc, 'You do not need to install again. Your data is kept.')
    table(doc, ['Window', 'Folder', 'Type this'], [('First', 'server', '**npm run dev**'), ('Second', 'web', '**npm run dev**')], widths=[1.5, 1.5, 3.77])
    para(doc, 'Then open **http://localhost:5173** in your browser.')
    doc.add_heading('7.3 Reset the demonstration data', 2)
    para(doc, 'Stop the server window (**Ctrl + C**), type **npm run seed**, then **npm run dev** again. All changes are lost and the demonstration data is recreated.')

    doc.add_heading('7.4 Back up and restore', 2)
    para(doc, 'While the server runs, it writes one copy of the database per day to **server/data/backups** and keeps 14 days of copies.')
    table(doc, ['To', 'Do this'], [
        ('Make a backup now', 'In a command window in the **server** folder, type **npm run backup**. Or sign in as the platform administrator and select **Back up now** in **Administration > Configuration**.'),
        ('Restore a backup', 'Stop the server (**Ctrl + C**). Copy the chosen file from **server/data/backups** over **server/data/cortexplm.db**. Start the server again with **npm run dev**.'),
        ('Keep backups elsewhere', 'Copy the **server/data/backups** folder to another disk or a network share regularly.'),
    ], widths=[1.8, 4.97])

    h1(doc, '8. Optional Settings', new_page=False)
    para(doc, 'The application works without any setting. The items below are for administrators who want to go further.')
    table(doc, ['Setting', 'How to change it'], [
        ('Port numbers', 'In the **server** folder, copy **.env.example** to a new file named **.env** and change **PORT**. The web application expects port 4000.'),
        ('Security secret', 'In **.env**, replace **APP_SECRET** with a long random text before real use.'),
        ('Outgoing e-mail', 'In **.env**, fill in the **SMTP_** lines with your mail server. Without them, e-mail notifications stay queued and in-app notifications still work.'),
        ('Live AI model', 'Optional. In the application, open **Settings**, section **Live AI model**, and type an API key. Without a key, the built-in suggestions are used.'),
        ('Backups', 'In **.env**, **BACKUP_RETENTION_DAYS** sets how many days of backups are kept (default 14); **BACKUP_DAILY=off** stops the automatic daily backup.'),
        ('OnPrem licence file', 'In **.env**, set **DEPLOYMENT_MODE=onprem**. The vendor signs a licence with **npm run sign-licence**; the administrator installs it in **Administration > Licensing**.'),
    ], widths=[1.6, 5.17])

    h1(doc, '9. Troubleshooting', new_page=False)
    table(doc, ['What you see', 'What to do'], [
        ('"node" or "npm" is not recognized', 'Node.js is not installed or the window was opened before the installation. Close the window, open a new one, and check with **node -v**.'),
        ('"CortexPLM needs Node.js 22.13 or newer"', 'Install the current LTS version from nodejs.org, then run **npm install** again.'),
        ('npm install shows network errors', 'Check the Internet connection. On a company network, ask IT whether a proxy is required for npm.'),
        ('"The database is empty"', 'Stop the server (**Ctrl + C**), type **npm run seed**, then **npm run dev**.'),
        ('"Port 4000 is already in use"', 'CortexPLM is already running in another window. Use that window, or close it and start again.'),
        ('The browser says the site cannot be reached', 'The **web** window is closed. Start it again with **npm run dev** in the web folder.'),
        ('The sign-in page says "Request failed" or nothing happens', 'The **server** window is closed or still starting. Start it and wait for "CortexPLM API is running".'),
        ('"E-mail or password is incorrect."', 'Check the address (for example **pm1@metrocity.example**) and the password **Demo#2026**. Passwords are case-sensitive.'),
    ], widths=[2.4, 4.37])
    doc.save(out)


if __name__ == '__main__':
    build(sys.argv[1])

# mySCM Macro Process Register

A production-ready web application for documenting, scoring, and prioritising Supply Chain Management macro processes. Built on the D01 mySCM specification (Trg-O2D GTM).

## Folder Structure

```
scm-app/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx          # Sidebar + topbar shell
│   │   └── ProcessEditModal.jsx # 63-field tabbed edit modal
│   ├── contexts/
│   │   ├── AuthContext.jsx     # Firebase auth + user doc
│   │   ├── LanguageContext.jsx # i18n (EN/FR/AR + RTL)
│   │   └── AppContext.jsx      # Active company/scenario state
│   ├── hooks/
│   │   └── useProcesses.js     # Firestore process loader + ranking
│   ├── lib/
│   │   ├── constants.js        # 49 MASTER processes + dropdown lists
│   │   ├── formulas.js         # All 13 scoring formulas
│   │   └── translations.js     # EN/FR/AR UI strings
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CompaniesPage.jsx
│   │   ├── ScenariosPage.jsx
│   │   ├── ProcessRegisterPage.jsx
│   │   ├── RecycleBinPage.jsx
│   │   ├── FrameworkPage.jsx
│   │   └── AdminPage.jsx
│   ├── App.jsx
│   ├── firebase.js
│   ├── main.jsx
│   └── index.css
├── .env.example
├── firestore.rules
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Quick Start (Local Development)

```bash
# 1. Clone and install
npm install

# 2. Copy env file and fill in Firebase config
cp .env.example .env
# Edit .env with your Firebase values

# 3. Start dev server
npm run dev

# 4. Build for production
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_ADMIN_EMAIL=admin@example.com
```

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Auth**: Firebase Authentication (Email/Password)
- **Database**: Cloud Firestore
- **Hosting**: Netlify (free tier)
- **i18n**: English, French, Arabic (with RTL support)

## Features

- 49 macro processes across Plan/Source/Make/Deliver/Return/Enable cycles
- 13 automated scoring formulas (BPMN Readiness, Execution Mode, ROI, VOI, Priority)
- Real-time score preview in edit modal
- Automation Wave assignment (Wave 1/2/3)
- 2×2 Heatmap quadrants (Quick Win / High ROI / High VOI / Strategic)
- Multi-language UI (EN/FR/AR with RTL)
- Recycle bin with restore capability
- JSON export per scenario
- Admin panel with user management and global insights

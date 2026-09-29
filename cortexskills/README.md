# CortexSkills

Training engineering platform: 33 end-to-end processes in seven phases, from the scope of work to the evaluation of results, for large companies and SMEs in 29 sectors, in English, French and Arabic.

## Start in three steps

You need **Node.js 22.13 or newer** (free, from https://nodejs.org — choose the LTS version).

**1. Server** — open a terminal in the `server` folder:

```
npm install
npm run seed
npm run dev
```

**2. Web application** — open a second terminal in the `web` folder:

```
npm install
npm run dev
```

**3. Open** http://localhost:5173 and sign in.

| Account | E-mail | Password |
|---|---|---|
| Platform administrator | admin@cortexskills.app | Admin#2026 |
| Head of L&D, large company (automotive) | headld@atlasmotorskenitra.ma | CortexSkills#2026 |
| Head of L&D, SME (automotive) | headld@tangerautoparts.ma | CortexSkills#2026 |
| Head of L&D, SME (construction) | headld@soussbtpsolutions.ma | CortexSkills#2026 |
| Head of L&D, SME (healthcare) | headld@cliniquealamal.ma | CortexSkills#2026 |

`npm run seed` erases all data and recreates the demonstration data: run it only the first time, or when you want to start again. Next time, just run `npm run dev` in each folder.

See the Installation Guide and the User Guide (Word and PDF) for details.

## Other commands (server folder)

| Command | Purpose |
|---|---|
| `npm start` | Production mode; serves the built web application (`npm run build` in `web`) on http://localhost:4000 |
| `npm test` | Cross-tenant and security tests (run after `npm run seed`) |
| `npm run backup` | Backup now (automatic backups run daily, kept 14 days) |
| `npm run sign-licence` | Produce a signed licence file for an on-premises installation |

Settings go in `server/.env` (PORT, DEPLOYMENT_MODE=saas|onprem, DATA_DIR, JWT_SECRET, LICENSE_HMAC_SECRET, BACKUP_RETENTION_DAYS, CORS_ORIGIN).

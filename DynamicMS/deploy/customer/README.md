# DynamicMS — production installation, customer side (on-premises, with seeded data)

This folder runs DynamicMS in **production mode** on the customer's own infrastructure (data
center, private cloud or air-gapped network), with the **seeded data** loaded at the first start.

## What this installation does

- **Sign-in page:** email and password fields only. No account is listed.
- **Administrator:** created at the first start from `.env`. The built-in vendor account does not exist.
- **Seeded data:** loaded at the first start (about one minute): 2 groups and 60 organizations,
  120 complete QMS and QHSE projects, 1,140 accounts with their recorded steps, documents,
  KPIs, nonconformities and audits. Names and figures are fictional.
- **Passwords:** every account of the seeded data signs in first with `SEED_PASSWORD` and must
  choose its own password before anything else (12 characters with upper case, lower case and a
  digit). The demonstration password `Demo@2026` does not work.
- **Licence:** until the licence file issued by the editor is installed, the platform is
  **read-only for everybody**, the platform administrator included. Once installed:
  - only the packs, add-ons and standards listed in the licence can be enabled;
  - active accounts cannot exceed the licensed seats;
  - the licence expiry date is enforced.
- **No internet needed:** fonts and libraries are inside the image. External AI models stay off
  unless an administrator configures one.

## Requirements

- Docker Engine 24 or later with Docker Compose v2.
- 2 CPU, 4 GB RAM, 10 GB disk for the data volume.
- From the editor: the image (`dynamicms-2026.10.tar.gz`) or the source to build it, the public
  key `public.pem` and the licence file `licence.lic`.

## Install

1. **Image.** Load it: `docker load < dynamicms-2026.10.tar.gz` — or build it from the source
   (DynamicMS folder): `docker build -t dynamicms:2026.10 .`
2. **Public key.** Put the editor's `public.pem` in `licence/public.pem` (this folder).
3. **Settings.** Copy `.env.example` to `.env` and fill in `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `SEED_PASSWORD`, `JWT_SECRET` (`openssl rand -hex 32`) and `CORS_ORIGIN`.
4. **Start:** `docker compose --env-file .env up -d`, then `docker logs -f dynamicms`. Wait for
   `done: 60 organizations, 120 projects…` and `DynamicMS API listening`.
5. **Administrator.** Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and choose a new password.
6. **Licence.** Administration › Licence › install `licence.lic`. The status turns to valid and
   the platform becomes writable.
7. **Users.** Give users their seeded account and `SEED_PASSWORD`, for example:
   `quality@horizon-universal.example`, `ims@horizon-universal.example`,
   `ceo@horizon-universal.example` (organization Horizon Universal Holdings). Accounts follow
   the pattern `<role>@<organization domain>`; the full list is under Organization › Users.

`ADMIN_PASSWORD` and `SEED_PASSWORD` are used once, at the first start. To start **without the
seeded data**, set `INIT_DATA: empty` in `docker-compose.yml` before the first start; after the
first start, the choice only changes with a new, empty data volume.

## Operations

- **Data:** database, files, backups and the installed licence are in the `dynamicms-data` volume.
  A backup is taken every day and kept `BACKUP_RETENTION_DAYS` days. Back up the volume with the
  customer's usual tools.
- **Renewing the licence:** install the new `licence.lic` in Administration › Licence.
- **Upgrade:** load the new image, then `docker compose up -d`. Data is migrated in place; the
  seeded data is never loaded again.
- **HTTPS:** publish the application through the customer's reverse proxy; the container serves
  HTTP on port 4000.
- **Health:** `GET /api/health` returns `"deployment":"onprem"`, `"mode":"production"` and the
  licence status.

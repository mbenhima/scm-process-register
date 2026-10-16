# DynamicMS — production installation, editor side (SaaS)

This folder runs DynamicMS in **production mode** on the editor's own servers (deployment mode
SaaS). It also holds the tool that issues licence files to on-premises customers.

## What production mode does

| | Demo mode (development) | Production mode (this folder) |
|---|---|---|
| Sign-in page | Lists demonstration accounts and passwords | Email and password fields only — no account shown |
| Database at first start | Must be seeded by hand | Created automatically: catalog, libraries and **one platform administrator**; no organization, no demonstration data |
| Administrator | Built-in `admin@dynamicms.example` / `Admin@2026` | Email and password taken from `.env`; the built-in account does not exist |
| First sign-in | — | Every account created with an initial password must choose its own before anything else |
| Passwords | 8 characters | 12 characters with upper case, lower case and a digit |
| Start-up checks | — | Refuses to start without `ADMIN_EMAIL`, `ADMIN_PASSWORD` and a `JWT_SECRET` of at least 32 characters |

## Requirements

- Docker Engine 24 or later with Docker Compose v2.
- 2 CPU, 4 GB RAM, 10 GB disk for the data volume (more with many attachments).
- A reverse proxy for HTTPS (nginx, Traefik, a cloud load balancer). The container serves HTTP on port 4000.

## Install

1. **Settings.** Copy `.env.example` to `.env` and fill in `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `JWT_SECRET` (`openssl rand -hex 32`) and `CORS_ORIGIN` (the public address).
2. **Setup file (optional).** Copy `setup.example.json` to `setup.json` and describe your groups,
   organizations, their configuration, users and projects (see below). Without a setup file,
   create them in the application (Administration and Organization menus).
   If you don't use it, remove the `SETUP_FILE` line from `.env` and the `setup.json` volume line
   from `docker-compose.yml`.
3. **Build the image** (from this folder): `docker compose build`
   — or from the DynamicMS folder: `docker build -t dynamicms:2026.10 .`
   Behind a registry limit, add `--build-arg NODE_IMAGE=mirror.gcr.io/library/node:22-bookworm-slim`.
4. **Start:** `docker compose --env-file .env up -d`, then follow `docker logs -f dynamicms-editor`.
   The first start takes a few seconds and prints `DynamicMS API listening`.
5. **Sign in** with `ADMIN_EMAIL` and `ADMIN_PASSWORD`; the application asks for a new password.
   `ADMIN_PASSWORD` is used once, at the first start; changing it later in `.env` has no effect.

## Setup file

Read at every start. Groups, organizations (by e-mail domain), users (by e-mail) and projects (by
code or name) already present are skipped, so the file can be kept and extended. Every item goes
through the same rules as the application (packs, quotas, password policy); errors are printed in
the logs as `[setup] …` and the other items are still created.

| Field | Content |
|---|---|
| `groups[]` | `key` (referenced by organizations), `name`, `description` |
| `organizations[]` | `group` (a group key, optional), `name`, `code`, `sector` (segment code, for example `HCA` healthcare providers, `UNI` universal), `size` (`Large` or `SME`), `employees`, `country`, `city`, `lang` (`en`, `fr`, `ar`), `emailDomain` (unique), `currency`, `currencies` |
| `organizations[].config` | `pack` (`DMS-SME`, `DMS-PRO`, `DMS-ENT`), `industryPacks`, `capabilityPacks`, `addons`, `complianceStandards`, `deploymentMode` |
| `organizations[].admin` | The organization's administrator: `email`, `name`, `password` (initial) |
| `organizations[].users[]` | `email`, `name`, `roles` (for example `quality_manager`, `ims_manager`, `top_management`, `employee`), `password` (initial), `lang` |
| `organizations[].projects[]` | `name`, `code`, `msType` (`QMS` or `QHSE`), `template` (library code, for example `TPL-HCA-FULL-QMS`), `startDate`, `endDate` |

Initial passwords must follow the password rule; each person changes theirs at first sign-in.
Keep `setup.json` out of version control once it holds passwords.

## Operations

- **Data:** everything (database, files, backups, licence) is in the `dynamicms-data` volume.
  A backup is taken every day and kept `BACKUP_RETENTION_DAYS` days.
- **Upgrade:** rebuild the image with the new version, then `docker compose up -d`. Data is
  migrated in place at start-up; nothing is reseeded.
- **Logs:** `docker logs dynamicms-editor`. Health: `GET /api/health` (`"mode":"production","demo":false`).

## Licences for on-premises customers

The editor signs each customer's licence with its private key; the customer's server only holds
the public key. On the editor's build machine, in the `server` folder:

```
npm run sign-licence -- --customer "Atlas Health Group" --seats 1500 --expires 2027-12-31 \
  --packs DMS-PRO,DMS-LSCI,DMS-CERT,DMS-AI --mode DEP-5
```

- The first run creates `server/licence/private.pem` (keep it secret, never ship it) and `public.pem`.
- Give the customer `public.pem` and the `licence.lic` file written by the command.
- `--packs` lists every pack, add-on and Compliance & Security Standard the customer may enable.
- `--seats` counts active accounts, the platform administrator excluded. A customer installed
  **with seeded data** starts with 1,140 accounts: give at least 1,140 seats, or the platform
  stays read-only.

To ship the image to a customer without internet access:
`docker save dynamicms:2026.10 | gzip > dynamicms-2026.10.tar.gz`.

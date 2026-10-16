# DynamicMS — release notes

## 2026.10 (SRS revision 1.9)

### Upgrade an existing installation

1. Stop the server.
2. Replace the application files (keep `server/data/`, `server/storage/` and `server/backups/`).
3. Run `npm install` in `server/` if the dependencies changed.
4. **Restart the server.** At its first start it migrates the data in place: no reseed is needed.

Each migration runs once, is recorded in the table `schema_migrations` with what it changed,
and is safe to run again (NFR-DA-MAINT-11). The server log lists the migrations it applied.

| Migration | What it changes |
|---|---|
| `2026.10.1-e2e-process-names` | New names of six end-to-end processes in the catalog and in document titles. |
| `2026.10.2-row-stamps` | A Row Stamp on every row of the step tables, template lists and registers (edit conflicts). |
| `2026.10.3-ai-governance` | AI Use Cases of the application places, links to the process design, derived fields stored, complete seeded prompt specifications, append-only usage log (proposal + one entry per outcome). |
| `2026.10.4-currencies` | Default and enabled currencies of each organization; the currency of every recorded amount. |

### What is new

- Production mode (`APP_MODE=production`) and Docker deployment for the editor side (SaaS) and the
  customer side (on-premises): no demonstration account on the sign-in page, administrator from the
  environment, password change at first sign-in, setup file, licence enforced on-premises
  (read-only until installed, licensed packs and seats), licence installation in Administration.

- Multi-Record Data Entry on every table of records (SRS 4.49): paste, import with repair and
  undo, export, edit conflicts, draft backup, full-screen workspace, phone list.
- AI governance: every AI suggestion runs through an active AI Use Case serving its place, with
  model precedence (use case model, Organization model, personal connection, built-in engine),
  per-item review and an append-only usage log; use case page, form, duplicate, coverage of the
  process design, library figures.
- Several currencies per organization; totals given per currency.
- Function × Level Matrix step form; a reopened step reads as open everywhere.
- Word, Excel and PowerPoint files checked before download so that they open without repair.
- File names with non-Latin characters sent encoded (RFC 6266); CSV in UTF-8 with a byte-order mark.

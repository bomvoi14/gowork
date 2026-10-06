# GTD-GoWork — Changelog

## v1.0.0 — Production verified — 2026-10-06
### Security
- LINE Login required before application access
- stable LINE User ID stored in server session and mapped to EmpID
- Google Sheets changed to Restricted and accessed server-side
- server-side authorization: User edits self only; Admin can edit others
- registration verifies employee data before binding
- login and profile-edit audit are written server-side

### Production verification
- LINE Login: PASSED
- application access: PASSED
- Craft/phone edit: PASSED
- `แจ้งแก้ไข` audit: PASSED
- `ประวัติ Login` audit: PASSED
- footer/version: `GTD-GoWork v1.0.0 · Created by BOM_GTD`
- v1.0.0 baseline commit: `a98b9188550a6050634d1d4a980f30ebc84cf291`

### Notes
- Production LINE callback: `https://gtd-gowork.vercel.app/api/auth/callback/line`
- secrets and private keys are stored in environment variables, not source control

## Planned v1.1.0
- permanent `staging` workflow
- LINE = mandatory Primary Identity
- optional Google/Facebook additional sign-in methods after primary registration
- one employee identity may have additional providers, but additional providers cannot independently create an EmpID identity
- self-service link/unlink/replace optional providers
- preserve historical audit when an optional provider is removed
- support/contact ticket system
- admin notification for new tickets, preferably LINE OA / Messaging API
- status flow for tickets and optional notification back to the employee
- audit account linking/unlinking and support actions
- hardening: failed-attempt cooldown, generic verification errors, stronger duplicate/concurrency controls

## Historical Beta
Beta v0.11.x covered PWA, guided tour, navigation/cache refinements and the pre-Security-V1 production flow. Security V1 replaced the Beta architecture at v1.0.0.

## Release rule
Every release records version/date, changes, security impact, tests actually performed, commit/tag where applicable, and Production verification status.

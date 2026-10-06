# GTD-GoWork — Work Queue
Last reviewed: 2026-10-07

## v1.0.0 — completed
- [x] LINE Login required
- [x] LINE User ID ↔ EmpID registration
- [x] Google Sheets private/server-side access
- [x] User edits self only / Admin edit authorization
- [x] Login audit
- [x] Edit audit
- [x] Production smoke test
- [x] Production version/footer v1.0.0
- [x] Create permanent `staging` branch from v1.0.0 baseline

## v1.1.0 — Multi-login / Account management
- [ ] design provider-link data schema separate from employee identity
- [ ] keep LINE as mandatory Primary Identity
- [ ] add Google provider
- [ ] add Facebook provider
- [ ] additional providers cannot create EmpID independently
- [ ] create “บัญชีของฉัน” account-management UI
- [ ] link optional provider only after verified primary identity
- [ ] unlink/replace Google or Facebook with secure re-authentication
- [ ] do not allow normal self-service deletion of Primary LINE
- [ ] audit provider linked / unlinked / replaced
- [ ] test two-device scenario with different sign-in providers

## v1.1.0 — Support / Contact
- [ ] add “แจ้งปัญหา / ติดต่อผู้ดูแล” entry
- [ ] add support access from login page
- [ ] create ticket data schema/sheet
- [ ] categories: login / data / edit / account / other
- [ ] auto-capture safe context: EmpID, name, timestamp, app version
- [ ] ticket status: received / in progress / resolved
- [ ] configure LINE OA / Messaging API for admin notification
- [ ] notify admin when a new ticket is created
- [ ] optionally notify employee when resolved
- [ ] audit ticket status changes
- [ ] add screenshot attachment later if needed

## Security hardening
- [ ] 5 failed verification attempts -> 15 minute cooldown
- [ ] generic verification errors
- [ ] strengthen duplicate binding against concurrent requests
- [ ] define controlled Primary LINE recovery/change process
- [ ] review audit retention and admin permissions
- [ ] review PDPA/privacy notice for new provider/ticket data

## Release workflow
- [ ] configure Vercel Preview/Staging environment for `staging`
- [ ] make all v1.1.0 changes outside `main`
- [ ] batch changes -> deploy once -> test once
- [ ] regression test LINE login, registration, data view, edit and audits
- [ ] merge/promote only after approval
- [ ] update CHANGELOG/PROJECT at release

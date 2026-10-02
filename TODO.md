# GTD-GoWork — Work queue
Last reviewed: 2026-10-02. Planned items are proposals, not implemented features.

## Verify now
- [ ] Test Beta v0.11.9 Back behavior on installed Android PWA and normal browser; verify detail -> main, Group -> All, and double-Back exit.
- [ ] Confirm Vercel production deployment displays Beta v0.11.9; GitHub main already has this version.
- [ ] Confirm mobile install instructions match real Chrome/LINE/Safari user flow.
- [ ] Check data source: current Google Sheets CSV export must point to intended tab and columns.

## Quality and maintenance
- [ ] Improve browser/PWA history handling if real-device testing reveals issues.
- [ ] Consider moving large app/page.tsx into smaller components and tests, preserving behavior.
- [ ] Review external Apps Script write confirmation; current no-cors requests cannot reliably confirm remote save.
- [ ] Review security of edit authorization and employee data exposure before adding private documents.
- [ ] Replace generic README.md with project-specific onboarding if desired.

## Future feature: employee certificates/PDFs
- [ ] Design employee document area (📁 เอกสาร / ใบรับรอง) keyed by employee ID.
- [ ] Metadata: employee ID, document type/course, training date, expiry date, Drive file ID/URL, status.
- [ ] Proposed status: valid / expiring soon / expired.
- [ ] Design Google Drive storage + Google Sheet metadata so staff can update PDFs without redeploying app.
- [ ] Define LINE login-based access control; employee own documents vs authorized admins/Safety.
- [ ] Do not expose private PDF files through public Drive links.

## Working agreement
- Read PROJECT.md, REQUIREMENTS.md, CHANGELOG.md, TODO.md and current GitHub source at the start of a new chat.
- Update these docs when decisions or code change; distinguish planned, implemented, and verified behavior.

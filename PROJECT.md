# GTD-GoWork — Project Reference
Last reviewed: 2026-10-02 | GitHub: bomvoi14/gowork | branch: main | UI version: Beta v0.11.9

## Purpose
ระบบรายงานจำนวนวันปฏิบัติงานตามคำสั่ง (Site) สำหรับค้นหาบุคลากร ดูรายละเอียดตามหมวดหมู่ และสรุปตาม Group/Craft ไม่ใช่หลักฐานยืนยันวันปฏิบัติงานจริง

## Source of truth
- Always read the current GitHub main branch before modifying code. These documents are project notes, not a replacement for code.
- Repository: https://github.com/bomvoi14/gowork
- Production URL: https://gtd-gowork.vercel.app
- UI: app/page.tsx (currently Beta v0.11.9)
- Auth: app/api/auth/[...nextauth]/route.ts and app/providers.tsx
- PWA: app/manifest.ts, public/sw.js, app/icon.png, app/apple-icon.png, public/icon-*.png
- Guided tour illustration: public/tour-step3.jpg
- package.json: Next.js 16.3.4, React 19.2.8, next-auth 4.24.x, Papa Parse 5.7.x, Tailwind CSS 4

## Data flow
- Main display data: Google Sheets CSV export loaded by Papa.parse in app/page.tsx. Check actual sheet/tab and CSV columns before changing mappings.
- Editable Craft and phone: app sends POST to Apps Script; source script is external to this repository.
- LINE authentication: NextAuth LINE provider. Required environment variables include LINE_CLIENT_ID and LINE_CLIENT_SECRET; NEXTAUTH_URL must correspond to production URL.
- Google Sheet and Apps Script permissions and deployment must be verified separately; GitHub does not hold all application logic.

## Deployment workflow
1. Read current main and relevant files.
2. Compare requested change with REQUIREMENTS.md; preserve unrelated behavior.
3. Make a targeted change; test or explicitly disclose tests not run.
4. Obtain user approval for production-impacting changes unless explicitly authorized.
5. Commit changes to GitHub main and verify saved content.
6. Check Vercel deployment status when accessible; a GitHub commit alone does not prove production deployment.

## Important caveats
- Current package.json contains a deploy script using git add .; avoid it because it may stage unrelated local changes.
- App version, service-worker cache name, and Vercel production deployment are different things.
- Never store credentials, LINE secrets, private employee data, or private PDF links in project documentation.

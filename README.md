# GTD-GoWork

GTD-GoWork เป็นเว็บแอปสำหรับรายงานจำนวนวันปฏิบัติงานตามคำสั่ง (Site) ค้นหาบุคลากร ดูรายละเอียด และสรุปตาม Group/Craft

> ข้อมูลจำนวนวันในระบบเป็นข้อมูลตามคำสั่ง ไม่ใช่หลักฐานยืนยันวันปฏิบัติงานจริง

## Current status
- Production: **v1.0.0**
- Production branch: `main`
- Production URL: https://gtd-gowork.vercel.app
- Development / staging branch: `staging`
- Production v1.0.0 baseline: `a98b9188550a6050634d1d4a980f30ebc84cf291`
- Security V1 production smoke test: PASSED (LINE Login, app access, profile edit, edit audit, login audit)

## Production architecture
```text
User
  -> LINE Login
  -> Next.js Server/API
  -> LINE User ID <-> EmpID mapping
  -> Private Google Sheets
  -> Authorized data/edit APIs
  -> Login/Edit audit
```

## Security V1
- LINE Login required
- first registration binds LINE User ID to EmpID
- Google Sheets source is Restricted and accessed server-side
- normal User may view work data but edit only own profile
- Admin may edit other employees
- Login and Edit audits are stored server-side
- secrets live only in Vercel Environment Variables and must never be committed

## Technology
- Next.js 16.3.4 / React 19
- NextAuth + LINE Login
- Vercel
- Google Sheets API / Service Account

## Environment variable names
Production/Preview require the appropriate values for:
- `GOOGLE_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_ACCOUNT_SPREADSHEET_ID`
- `LINE_CLIENT_ID`
- `LINE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Never commit actual secret values, private keys, employee data, or credentials.

## Development workflow
- `main` = stable Production
- `staging` = integration/testing before Production
- feature branches = isolated development
- batch changes -> deploy Preview/Staging once -> test -> merge to `main` only after approval
- avoid unnecessary Production deployments

## Next target
v1.1.0 planning:
- LINE remains the mandatory Primary Identity for every employee
- optional Google/Facebook sign-in may be linked only after a valid LINE/EmpID identity exists
- optional provider accounts can be unlinked/replaced without deleting historical audit
- support/contact ticket flow with admin notification; LINE Messaging API / LINE OA is the preferred notification channel
- account-link/unlink and support actions require audit records

See `PROJECT.md`, `CHANGELOG.md`, and `TODO.md` for details.

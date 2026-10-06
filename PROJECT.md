# GTD-GoWork — Project Reference
Last reviewed: 2026-10-07 | Repository: bomvoi14/gowork | Production: v1.0.0

## Purpose
ระบบรายงานจำนวนวันปฏิบัติงานตามคำสั่ง (Site) สำหรับค้นหาบุคลากร ดูรายละเอียด และสรุปตาม Group/Craft ไม่ใช่หลักฐานยืนยันวันปฏิบัติงานจริง

## Branches and release baseline
- `main` = Production stable
- `staging` = permanent integration/test branch
- Production URL = https://gtd-gowork.vercel.app
- v1.0.0 baseline = `a98b9188550a6050634d1d4a980f30ebc84cf291`

## Production V1 architecture
```text
LINE Login
  -> NextAuth server session
  -> LINE User ID
  -> LINE_พนักงาน mapping
  -> EmpID / role
  -> private work-data/profile APIs
  -> Restricted Google Sheets
  -> Login/Edit audit
```

### Identity and roles
- LINE User ID is the stable external identity in v1.0.0.
- `LINE_พนักงาน` stores mapping/status/role.
- Role `Admin` grants admin edit ability; other active mappings are normal users.
- Users can view authorized work data and edit only their own employee profile.
- Authorization is enforced server-side; browser-provided identity is not trusted.

### Registration
First registration requires authenticated LINE session, numeric EmpID and 4 final characters of the English surname. Verification source is workbook 2026 sheet `ข้อมูล_อบค.` (EmpID B, English full name D). The surname suffix is used for verification and is not stored as a credential.

### Private data
Main work data is read server-side from the Restricted Google workbook. Service-account credentials and provider secrets remain only in environment variables.

### Profile edit
Profile API derives the current identity from the server session/mapping. Craft and phone writes are server-side and edit activity is audited.

### Audit
- `ประวัติ Login`: login event information
- `แจ้งแก้ไข`: profile-edit event information
Audit history must not be erased when login methods change.

## v1.1.0 identity direction
LINE remains mandatory as the Primary Identity so every employee has a LINE User ID on record.

After the employee has a valid LINE/EmpID identity, optional sign-in providers may be attached:
```text
EmpID
  -> LINE (Primary, required)
  -> Google (optional additional sign-in)
  -> Facebook (optional additional sign-in)
```

Rules:
1. Google/Facebook must not independently create a new EmpID identity.
2. Optional provider must be linked to an already verified employee identity.
3. Optional provider may be unlinked/replaced by the employee after secure re-authentication.
4. Removing an optional provider removes the login relationship, not historical audit.
5. Primary LINE is not self-deletable in the normal account screen; recovery/change requires a controlled process.
6. Account link/unlink/replacement must be audited.
7. Provider-specific IDs must be unique and server-side authorization remains mandatory.

## v1.1.0 support/contact direction
Add `แจ้งปัญหา / ติดต่อผู้ดูแล`:
- authenticated form pre-fills safe identity/context such as EmpID, employee name, date/time and app version
- categories: login, employee data, profile edit, Google/Facebook account, other
- ticket stored in a dedicated sheet
- status: received / in progress / resolved
- notify admin on new ticket; preferred channel is LINE Official Account via Messaging API
- optionally notify employee when resolved
- login page must also expose a support route because some users cannot enter the app
- future attachment/screenshot support can be added after the basic ticket flow is stable

## Deployment rules
- Do not develop new features directly on `main`.
- Develop on feature/staging, deploy once per meaningful batch, test, then promote.
- Environment changes require a new deployment to take effect.
- Never commit credentials, private keys, provider secrets or private employee data.
- Production changes require a smoke test and documentation update.

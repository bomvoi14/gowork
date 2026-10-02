# GTD-GoWork — Requirements and behavior to preserve
Last reviewed: 2026-10-02. Code-verified items are marked [CODE]; past discussion requirements are marked [DISCUSSION] and should be reconfirmed against current code before edits.

## Labels and main behavior
- [DISCUSSION] Group heading: จำนวนวันปฏิบัติงานตาม Group; visit label: ตรวจเยี่ยม Site/Site Survey:
- [CODE] Search by employee name, show person details and category counts, select Group/Craft and paginate summary.
- [CODE] Search input includes focus/select-all behavior. Do not break the ability to place cursor while already focused.
- [DISCUSSION] Show warning that reported days follow orders and cannot establish actual worked days.

## Welcome vs Guided Tour
- [CODE] Welcome and Tour are separate; Tour starts manually, not when Welcome is dismissed.
- [DISCUSSION] Welcome appears on ordinary open/refresh, but is skipped after LINE login/logout or successful edit via /?skipWelcome=1.
- [CODE] Tour has six 1-based steps; step 3 shows /tour-step3.jpg; retain highlights, scroll behavior, Back/Next/Skip/Done and manual 📘 วิธีใช้งาน trigger.
- [DISCUSSION] Welcome warning is red and larger; keep existing wording/design unless asked to change.

## Login and edit
- [CODE] LINE login via NextAuth; session stores LINE user ID. Edit form allows Craft and phone changes; saving overlay exists.
- [DISCUSSION] Successful edit -> ตกลง should return with skipWelcome=1. Do not assume no-cors POST proves server-side write succeeded; verification is a future quality improvement.

## PWA install
- [CODE] Manifest name GTD-GoWork App, short_name GTD-GoWork, standalone mode, start_url /?skipWelcome=1.
- [CODE] Install button uses native prompt when available; otherwise copies production URL and shows iOS/Android/computer instructions. Preserve existing wording unless explicitly requested.
- [CODE] Service worker cache currently gtd-gowork-v0.11.9.

## Back navigation
- [CODE] v0.11.9 includes Back handling for person details, Group reset, and double-Back exit message. Browser/PWA behavior requires real-device testing; do not assume consistent exit across platforms.

## UI and version
- [CODE] Browser title: GTD-GoWork App; current footer displays Beta v0.11.9.
- [DISCUSSION] Footer style: Created by BOM_GTD · Beta vX.Y.Z.
- Do not silently alter Thai labels, tour placement, install guidance, welcome text, login redirects, or current data mapping.

## Security and data integrity
- Treat employee details and future certificates as potentially sensitive.
- Do not put secrets in client components, markdown files, or public assets.
- Check access control before implementing document storage or broad employee editing.

# GTD-GoWork — Project Reference
Last reviewed: 2026-10-05 | GitHub: bomvoi14/gowork | production branch: main | UI version: Beta v0.11.11

## Purpose
ระบบรายงานจำนวนวันปฏิบัติงานตามคำสั่ง (Site) สำหรับค้นหาบุคลากร ดูรายละเอียดตามหมวดหมู่ และสรุปตาม Group/Craft ไม่ใช่หลักฐานยืนยันวันปฏิบัติงานจริง

## Source of truth
- อ่าน current GitHub source ก่อนแก้ทุกครั้ง เอกสารนี้เป็น reference ไม่ใช่ตัวแทน source code
- Repository: https://github.com/bomvoi14/gowork
- Production URL: https://gtd-gowork.vercel.app
- Production branch: `main`
- Security V1 development branch: `security-v1`
- UI: `app/page.tsx`
- Auth: `app/api/auth/[...nextauth]/route.ts` และ `app/providers.tsx`
- PWA: `app/manifest.ts`, `public/sw.js`, icons
- Guided Tour: `public/tour-step3.jpg`

## Current Beta architecture
- Main display data โหลด Google Sheets CSV export ใน browser ผ่าน Papa Parse
- Editable Craft/phone ส่ง POST ไป external Google Apps Script
- LINE authentication ใช้ NextAuth LINE provider
- Apps Script ปัจจุบันบันทึก:
  - `ประวัติ Login`: timestamp, LINE User ID, LINE name, image, action
  - `แจ้งแก้ไข`: timestamp, EmpID, name, Craft, phone, LINE name, status
- Apps Script อัปเดตสมุดงาน 2026 ชีท `รายละเอียด`: Craft คอลัมน์ I, phone คอลัมน์ J, Z1 เป็นเวลาอัปเดตล่าสุด
- สมุดงาน “แจ้งแก้ไข” มีชีทใหม่ `LINE_พนักงาน` เตรียมสำหรับ Security V1

## Confirmed privacy finding — 2026-10-05
- สมุดงาน 2026 ไม่ได้ Publish to web
- General access ปัจจุบันเป็น “Anyone with the link / Viewer”
- ทดสอบ Incognito แล้วสามารถเปิดสมุดงานได้โดยไม่ Login Google
- Beta ยังพึ่ง CSV จากสมุดงานนี้ จึงห้ามเปลี่ยนเป็น Restricted จนกว่า server-side private data path จะพร้อม

## Security V1 decisions
Target release: v1.0.0

### Login and registration
- ต้อง LINE Login ก่อนเข้า GTD-GoWork
- ผู้ใช้ประมาณ 150 คน ไม่ใช้ manual whitelist รายบุคคล
- ลงทะเบียนครั้งแรกด้วย:
  1. EmpID
  2. ยืนยัน EmpID อีกครั้ง
  3. 4 ตัวท้ายของนามสกุลภาษาอังกฤษ (case-insensitive)
  4. แสดงข้อมูลที่เหมาะสมให้ผู้ใช้ยืนยันก่อนผูกบัญชี
- Source สำหรับ verification: สมุดงาน 2026 ชีท `ข้อมูล_อบค.`
  - EmpID = column B
  - English full name = column D
- 4 ตัวท้ายใช้ตรวจสอบเท่านั้น ไม่เก็บซ้ำเป็น credential

### LINE ↔ EmpID
- 1 LINE User ID ผูกได้กับ 1 EmpID
- 1 EmpID มี LINE account ที่ Active ได้ 1 บัญชี
- สถานะ: Active / Inactive / Disabled
- เปลี่ยน LINE ต้องไม่ overwrite/delete ประวัติเก่า
- กรณีเปลี่ยนโทรศัพท์แต่ยังใช้ LINE account เดิม ไม่ต้อง re-register

### Edit authorization
- ผู้ใช้แก้ไขได้เฉพาะ EmpID ของตนเอง
- Server ต้อง derive EmpID จาก verified LINE session/mapping
- ห้ามเชื่อ `empId` หรือ `editedBy` ที่ browser ส่งมาเพื่อกำหนดสิทธิ์
- Login/Edit/registration/account-change audit ต้องเก็บต่อเนื่อง

### Private data target
```text
User -> LINE Login -> Next.js Server/API -> Private Google Sheet
```
- Browser ไม่ควรดาวน์โหลดฐานข้อมูลพนักงานโดยตรงจาก public CSV
- Server ส่งเฉพาะข้อมูลที่จำเป็น
- Google Sheet เปลี่ยนเป็น Restricted หลัง cutover เท่านั้น
- Secrets/credentials ต้องอยู่ server environment เท่านั้น

## Development and cutover
1. Freeze `main` สำหรับ Beta/Production ยกเว้น bugfix ที่จำเป็น
2. พัฒนา Security V1 ใน `security-v1`
3. ใช้ Vercel Preview และข้อมูลทดสอบ
4. ทดสอบ LINE registration, login, authorization, edit, audit, account-change และ error cases
5. ทดสอบ server-side private Sheet access
6. Deploy code ที่พร้อม production
7. เปลี่ยน Google Sheet เป็น Restricted
8. ทดสอบ Incognito ว่า Sheet/CSV เปิดไม่ได้
9. ทดสอบ GTD-GoWork end-to-end อีกครั้ง
10. ยืนยัน Production แล้วจึงประกาศ v1.0.0 และสร้าง Git tag/release
11. เก็บ rollback point ก่อน cutover

## Deployment rules
- Commit ≠ verified Vercel deployment
- หลีกเลี่ยง `npm run deploy` ปัจจุบันที่ใช้ `git add .`
- ไม่ commit credentials, LINE secrets, employee private data หรือ private file URLs
- การเปลี่ยนที่กระทบ Production ต้องผ่านการทดสอบและยืนยัน scope ก่อน merge เข้า `main`

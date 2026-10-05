# GTD-GoWork

GTD-GoWork เป็นเว็บแอปสำหรับรายงานจำนวนวันปฏิบัติงานตามคำสั่ง (Site) ค้นหาบุคลากร ดูรายละเอียดตามหมวดหมู่ และสรุปตาม Group/Craft

> ข้อมูลจำนวนวันในระบบเป็นข้อมูลตามคำสั่ง ไม่ใช่หลักฐานยืนยันวันปฏิบัติงานจริง

## Current status
- Production branch: `main`
- Current UI version: **Beta v0.11.11**
- Production URL: https://gtd-gowork.vercel.app
- Security V1 development branch: `security-v1`
- Target release: **Version 1.0.0**

ระบบ Beta ผ่านการทดลองใช้งานประมาณ 1 สัปดาห์และยังคงเปิดให้ผู้ใช้ทดลองระหว่างพัฒนา Security V1. ห้ามนำงานที่ยังไม่ผ่านการทดสอบไปแก้ `main` โดยตรง

## Technology
- Next.js 16.3.4 / React 19
- NextAuth + LINE Login
- Vercel
- Google Sheets
- Google Apps Script
- Papa Parse (ระบบ Beta ปัจจุบัน)

## Current Beta data flow
```text
Browser
  -> Google Sheets CSV export
  -> GTD-GoWork UI

LINE Login / Edit
  -> Google Apps Script
  -> Google Sheets
```

Google Sheet ต้นทางยังต้องเปิดอ่านผ่านลิงก์เพื่อรองรับ CSV ของ Beta ปัจจุบัน จึงห้ามเปลี่ยนเป็น Restricted จนกว่า Security V1 จะอ่านข้อมูลแบบ Private ผ่าน Server ได้และผ่านการทดสอบแล้ว

## Security V1 target architecture
```text
User
  -> LINE Login
  -> GTD-GoWork Server
  -> LINE ID <-> EmpID registration
  -> Private Google Sheet
  -> Authorized data/API
```

แนวทางที่ตกลงสำหรับ V1:
1. บังคับ LINE Login ก่อนเข้าใช้งาน
2. ลงทะเบียนครั้งแรกด้วย EmpID + ยืนยัน EmpID + 4 ตัวท้ายของนามสกุลภาษาอังกฤษ
3. ข้อมูลตรวจสอบมาจากสมุดงาน 2026 ชีท `ข้อมูล_อบค.`: EmpID คอลัมน์ B และชื่อ-นามสกุลภาษาอังกฤษคอลัมน์ D
4. 1 LINE ID ผูกกับ 1 EmpID และ 1 EmpID มี LINE ที่ Active ได้เพียง 1 บัญชี
5. แก้ไขได้เฉพาะข้อมูลของ EmpID ที่ผูกกับ LINE Session
6. เก็บ Login/Edit audit ต่อจากระบบเดิม
7. Google Sheet ต้องเปลี่ยนเป็น Restricted หลังระบบ Server-side ผ่านการทดสอบและ Cutover แล้ว
8. รองรับสถานะ Active / Inactive / Disabled และกระบวนการเปลี่ยน LINE โดยไม่ลบประวัติเก่า

## Account mapping
สมุดงาน “แจ้งแก้ไข” มีชีท `LINE_พนักงาน` สำหรับการผูกบัญชี โดยโครงสร้างที่วางไว้คือ:
- วันที่ลงทะเบียน
- EmpID
- ชื่อ-นามสกุล
- LINE User ID
- LINE Name
- สถานะ
- วันที่เปลี่ยนสถานะ
- หมายเหตุ

ห้ามเก็บคำตอบ “4 ตัวท้ายของนามสกุล” ซ้ำในชีท mapping; ใช้เพื่อตรวจสอบกับข้อมูลต้นทางเท่านั้น

## Development workflow
- `main` = Beta/Production ที่ผู้ใช้กำลังใช้งาน
- `security-v1` = พัฒนาและทดสอบ Security V1 ผ่าน Vercel Preview
- ทดสอบด้วยข้อมูลทดสอบก่อนใช้ข้อมูลจริง
- Merge เข้า `main` เมื่อ Security V1 ผ่านการทดสอบและพร้อม Cutover
- สร้าง Git tag/release `v1.0.0` เมื่อยืนยัน Production แล้ว
- ทุกครั้งที่เปลี่ยนเวอร์ชันให้อัปเดต `CHANGELOG.md`

## Project documents
- `PROJECT.md` — architecture, data flow, deployment rules
- `REQUIREMENTS.md` — behavior ที่ต้องรักษา
- `CHANGELOG.md` — ประวัติแต่ละ version
- `TODO.md` — งานที่ยังไม่เสร็จและแผน Security V1

## Local development
```bash
npm install
npm run dev
```

Environment secrets เช่น LINE credentials ต้องเก็บใน Environment Variables เท่านั้น ห้าม commit ลง GitHub

## Documentation rule
เอกสารเป็น reference สำหรับการพัฒนา แต่ source of truth ของ implementation คือโค้ด GitHub ปัจจุบัน ต้องอ่านโค้ดก่อนแก้ทุกครั้ง และต้องแยกให้ชัดระหว่าง **planned**, **implemented**, **tested**, และ **production verified**.

# GTD-GoWork — Work Queue
Last reviewed: 2026-10-05

## Current Beta verification
- [ ] ทดสอบ Beta v0.11.11 Back behavior บน Chrome จริงหลังปิด/เปิดแอปใหม่
- [ ] ทดสอบ Back บน LINE in-app browser
- [ ] ทดสอบ installed PWA
- [ ] ยืนยัน Vercel Production แสดง Beta v0.11.11
- [ ] ตรวจ install flow บน Android/iOS/computer

## Security V1 — Phase 1: isolated development
- [ ] สร้าง branch `security-v1` จาก documented main baseline
- [ ] ตั้ง Vercel Preview สำหรับ branch
- [ ] เตรียมข้อมูลทดสอบ 5–10 records; หลีกเลี่ยงการเขียนทับ production data ระหว่างพัฒนา
- [ ] ยืนยัน schema ชีท `LINE_พนักงาน`: registeredAt, EmpID, name, LINE User ID, LINE name, status, statusChangedAt, note

## Security V1 — Phase 2: registration
- [ ] บังคับ LINE Login ก่อนเข้าแอป
- [ ] ตรวจ LINE User ID ว่าผูกบัญชีแล้วหรือยัง
- [ ] หน้า registration: EmpID + confirm EmpID + 4 ตัวท้าย English surname
- [ ] ตรวจ EmpID จาก `ข้อมูล_อบค.!B:B`
- [ ] อ่าน English full name จาก `ข้อมูล_อบค.!D:D`
- [ ] แยก surname และตรวจ 4 ตัวท้ายแบบ case-insensitive
- [ ] ไม่ส่งข้อมูล verification ต้นฉบับที่ไม่จำเป็นไป browser
- [ ] ไม่เก็บ 4 ตัวท้าย surname ซ้ำใน mapping
- [ ] 1 LINE = 1 EmpID และ 1 EmpID = 1 Active LINE
- [ ] จำกัดจำนวน verification attempts; ข้อความ error ไม่เปิดเผยว่า field ใดผิด
- [ ] บันทึก registration audit

## Security V1 — Phase 3: authorization
- [ ] Server derive EmpID จาก LINE Session + mapping
- [ ] แก้ Craft/phone ได้เฉพาะ EmpID ของตนเอง
- [ ] ไม่เชื่อ client-provided EmpID/editedBy สำหรับ authorization
- [ ] เก็บ Edit Audit พร้อม verified LINE User ID และ EmpID
- [ ] รองรับ Active / Inactive / Disabled
- [ ] ออกแบบเปลี่ยน LINE โดยเก็บ account เดิมเป็น Inactive ไม่ลบประวัติ
- [ ] กำหนด recovery path เมื่อเข้า LINE เดิมไม่ได้

## Security V1 — Phase 4: private data
- [ ] สร้าง server-side data access สำหรับ Google Sheet
- [ ] จำกัด fields ที่ API ส่งกลับตามความจำเป็น
- [ ] ป้องกัน API จาก unauthenticated access
- [ ] ตรวจ secret/credential อยู่ใน server environment เท่านั้น
- [ ] ทดสอบ private data path ก่อนปิด public CSV
- [ ] หลังผ่านการทดสอบ เปลี่ยนสมุดงาน 2026 จาก Anyone with link เป็น Restricted
- [ ] Incognito ต้องเปิด Sheet/CSV ไม่ได้
- [ ] GTD-GoWork ต้องยังทำงานหลัง Sheet เป็น Restricted

## Security V1 — Phase 5: release
- [ ] Pilot 3–5 คน
- [ ] ทดสอบ first registration, repeat login, logout/login, wrong EmpID, wrong surname, duplicate LINE, duplicate EmpID
- [ ] ทดสอบแก้ข้อมูลตัวเองสำเร็จ
- [ ] ทดสอบพยายามแก้ข้อมูลคนอื่นแล้วต้องถูกปฏิเสธ
- [ ] ตรวจ Login/Edit/registration audit
- [ ] สร้าง rollback point
- [ ] Merge `security-v1` -> `main`
- [ ] ตรวจ Vercel Production
- [ ] ประกาศ Version 1.0.0
- [ ] สร้าง Git tag/release `v1.0.0`
- [ ] อัปเดต CHANGELOG ด้วย commit/test/deployment verification จริง

## Quality / maintenance
- [ ] แยก `app/page.tsx` เป็น components เมื่อเหมาะสม โดยไม่เปลี่ยน behavior
- [ ] ปรับ write confirmation; Beta ปัจจุบันใช้ `no-cors` จึงอ่าน response จาก Apps Script ไม่ได้อย่างน่าเชื่อถือ
- [ ] ตรวจ data retention ของ Login/Edit audit และสิทธิ์ผู้ดูแล
- [ ] ตรวจ PDPA/privacy notice ให้สอดคล้องกับข้อมูลที่ประมวลผล

## Future
- [ ] Employee documents/certificates area หลัง Security V1
- [ ] ห้ามใช้ public Drive links สำหรับเอกสารส่วนบุคคล

## Working agreement
- เริ่มงานใหม่ให้อ่าน `PROJECT.md`, `REQUIREMENTS.md`, `CHANGELOG.md`, `TODO.md` และ current source
- ทุก version update `CHANGELOG.md`
- แยกสถานะ planned / implemented / tested / production verified ให้ชัด

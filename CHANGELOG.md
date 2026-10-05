# GTD-GoWork — Changelog

ประวัติการเปลี่ยนแปลงของ GTD-GoWork แยกสถานะระหว่างโค้ดใน GitHub กับการยืนยัน Production จริง ไม่ถือว่า commit สำเร็จเท่ากับ deploy สำเร็จ

## Maintenance — 2026-10-05 — GitHub verified
### Changed
- ปิดหน้า Beta Production ชั่วคราวและแสดงหน้า Maintenance เพื่อพัฒนา Security V1
- หน้า Maintenance ไม่มีการโหลด employee CSV, ไม่มี LINE Login และไม่มีการส่งคำขอแก้ไขข้อมูลจากหน้าแอป
- เก็บ Beta v0.11.11 ไว้ในประวัติ Git สำหรับ rollback

### Deployment status
- ยืนยันเฉพาะการเปลี่ยนแปลงใน GitHub `main`; ต้องตรวจ Vercel Production แยกต่างหาก
- การปิดหน้าเว็บไม่เท่ากับการปิดสิทธิ์ Google Sheet; ต้องเปลี่ยน Sheet เป็น Restricted แยกต่างหากหลังตรวจ dependency แล้ว

## Unreleased — Security V1 / target v1.0.0

### Planned
- บังคับ LINE Login ก่อนเข้าใช้งาน
- ลงทะเบียน LINE ↔ EmpID ครั้งแรก
- ยืนยันด้วย EmpID 2 ครั้ง + 4 ตัวท้ายของนามสกุลภาษาอังกฤษ
- ตรวจข้อมูลจาก `ข้อมูล_อบค.` (EmpID = B, English name = D)
- 1 LINE ID = 1 EmpID; 1 EmpID = 1 Active LINE
- สถานะ Active / Inactive / Disabled
- รองรับกระบวนการเปลี่ยน LINE โดยรักษาประวัติเดิม
- จำกัดการแก้ไขเฉพาะข้อมูลของตนเองจาก LINE Session ฝั่ง Server
- ย้ายการอ่านข้อมูลพนักงานจาก public CSV ไป Server-side access
- เปลี่ยน Google Sheet ต้นทางเป็น Restricted หลัง Cutover
- เก็บ Login/Edit audit ต่อจากระบบเดิม
- จำกัดจำนวนครั้งของการยืนยันข้อมูลที่ผิด และไม่เปิดเผยว่า field ใดผิด

### Development policy
- พัฒนาใน branch `security-v1`
- `main` แสดง Maintenance ระหว่างการพัฒนา; Beta v0.11.11 เก็บไว้เป็น rollback history
- หลังหยุด Beta ให้ตรวจว่าไม่มีระบบอื่นพึ่ง public CSV แล้วจึงเปลี่ยน Google Sheet เป็น Restricted; Security V1 จะใช้ Private server-side path

## Beta v0.11.11 — 2026-10-05 — GitHub verified
### Fixed
- เพิ่มการจัดการ `pageshow`/BFCache เพื่อ reset สถานะ Back guard เมื่อกลับเข้าแอป
- ปรับ Back guard สำหรับการเปิดแอปซ้ำใน Chrome
- ปรับ service-worker cache เป็น `gtd-gowork-v0.11.11`

### Notes
- การทำงาน Back บน Chrome/LINE/PWA ยังต้องถือผลทดสอบอุปกรณ์จริงเป็นหลัก
- Production deployment ต้องตรวจแยกจาก GitHub commit

## Beta v0.11.10 — 2026-10-05 — GitHub verified
### Changed
- เปลี่ยน service worker สำหรับ same-origin assets เป็น network-first เพื่อลดปัญหา UI/version เก่าค้างจาก cache
- bump cache/version จาก v0.11.9

## Beta v0.11.9 — 2026-10-02 — GitHub verified
### Changed
- ปรับ Back navigation: ออกจากรายละเอียดพนักงาน, reset Group, และ double-Back exit prompt
- ปรับ footer credit เป็นรูปแบบเดียวกัน
- service-worker cache `gtd-gowork-v0.11.9`

## Beta v0.11.8
- ปรับคำแนะนำการติดตั้งข้ามแพลตฟอร์ม

## Beta v0.11.7
- เพิ่ม PWA installation instructions และ fallback copy-link flow

## Beta v0.11.6
- เพิ่ม iOS install helper และปรับ Welcome warning

## Beta v0.11.5
- ปรับ search focus/select-all และ cursor handling

## Beta v0.11.4
- จัดตำแหน่ง Guided Tour step แรก

## Beta v0.11.3
- ปรับ Guided Tour Step 3 preview image

## Beta v0.11.2
- เพิ่มภาพ `/tour-step3.jpg`

## Beta v0.11.0–v0.11.1
- Guided Tour 6 ขั้นตอนและปรับ placement

## Earlier v0.10.x
- PWA/install และ Tour refinements

## Release recording rule
ทุก release ควรบันทึก:
- วันที่
- Version
- Added / Changed / Fixed / Security
- การทดสอบที่ทำจริง
- Commit SHA / Git tag เมื่อเหมาะสม
- Production deployment verification status

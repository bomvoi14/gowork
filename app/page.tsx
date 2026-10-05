export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 flex items-center justify-center">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-900 px-7 py-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
            🔒
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-300">GTD-GoWork</p>
          <h1 className="mt-2 text-2xl font-bold">ระบบอยู่ระหว่างปรับปรุง</h1>
        </div>

        <div className="px-7 py-8 text-center">
          <h2 className="text-lg font-bold text-slate-800">Security Update</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            ระบบ GTD-GoWork ปิดให้บริการชั่วคราว
            เพื่อปรับปรุงระบบความปลอดภัยและการคุ้มครองข้อมูล
          </p>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800">
            ข้อมูลและประวัติเดิมยังคงเก็บรักษาไว้
            กรุณารอประกาศเปิดใช้งานระบบเวอร์ชันใหม่
          </div>

          <p className="mt-7 text-xs leading-5 text-slate-400">
            ขออภัยในความไม่สะดวก
          </p>
        </div>

        <footer className="border-t border-slate-100 px-6 py-4 text-center text-[11px] font-medium text-slate-400">
          Created by BOM_GTD · Maintenance
        </footer>
      </section>
    </main>
  );
}

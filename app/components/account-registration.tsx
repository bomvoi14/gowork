"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";

export function AccountRegistration({ onRegistered }: { onRegistered: () => void }) {
  const [empId, setEmpId] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\d+$/.test(empId)) return setError("กรุณากรอกเลขประจำตัวเป็นตัวเลขเท่านั้น");
    if (sentTo && !/^\d{6}$/.test(code)) return setError("กรุณากรอก OTP 6 หลัก");
    setBusy(true);
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId, action: sentTo ? "verify" : "request", code }),
      });
      const result = await response.json();
      if (!response.ok) return setError(result?.error || "ไม่สามารถลงทะเบียนได้");
      if (!sentTo) { setSentTo(result.email); return; }
      onRegistered();
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-5 flex items-center justify-center">
      <div className="w-full rounded-3xl bg-white p-6 shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">ลงทะเบียนเข้าใช้งานครั้งแรก</h1>
          <p className="mt-2 text-sm text-gray-500">ยืนยันผ่านอีเมลองค์กร EGAT</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold text-gray-700">เลขประจำตัว
            <input value={empId} disabled={Boolean(sentTo)} onChange={(e) => setEmpId(e.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="[0-9]*" autoComplete="off" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-sm" />
          </label>
          {sentTo && <>
            <p className="text-sm text-gray-600">ส่งรหัส OTP ไปที่ <strong>{sentTo}</strong> แล้ว (รหัสหมดอายุใน 5 นาที)</p>
            <label className="block text-sm font-bold text-gray-700">รหัส OTP 6 หลัก
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-center text-lg font-bold tracking-[0.35em]" />
            </label>
            <button type="button" className="text-sm text-green-700 underline" onClick={() => { setSentTo(""); setCode(""); setError(""); }}>เปลี่ยนเลขประจำตัว / ขอรหัสใหม่</button>
          </>}
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "กำลังตรวจสอบ..." : sentTo ? "ยืนยัน OTP และลงทะเบียน" : "ส่ง OTP ไปยังอีเมลองค์กร"}</button>
        </form>
        <button
          type="button"
          disabled={cancelling}
          onClick={() => {
            setCancelling(true);
            signOut({ callbackUrl: "/" });
          }}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-60"
        >
          {cancelling ? "กำลังยกเลิก..." : "ยกเลิกการลงทะเบียน"}
        </button>
      </div>
    </div>
  );
}

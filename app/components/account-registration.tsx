"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";

export function AccountRegistration({ onRegistered }: { onRegistered: () => void }) {
  const [empId, setEmpId] = useState("");
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\d+$/.test(empId)) return setError("กรุณากรอกเลขประจำตัวเป็นตัวเลขเท่านั้น");
    if (!/^[A-Za-z]{4}$/.test(suffix)) return setError("กรุณากรอก 4 ตัวท้ายของนามสกุลภาษาอังกฤษ");
    setBusy(true);
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId, surnameSuffix: suffix }),
      });
      const result = await response.json();
      if (!response.ok) return setError(result?.error || "ไม่สามารถลงทะเบียนได้");
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
          <p className="mt-2 text-sm text-gray-500">ผูกบัญชี LINE กับข้อมูลพนักงานของคุณ</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold text-gray-700">เลขประจำตัว
            <input value={empId} onChange={(e) => setEmpId(e.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="[0-9]*" autoComplete="off" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-sm" />
          </label>
          <label className="block text-sm font-bold text-gray-700">4 ตัวท้ายของนามสกุลภาษาอังกฤษ
            <input value={suffix} onChange={(e) => setSuffix(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase())} maxLength={4} autoComplete="off" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-center text-lg font-bold uppercase tracking-[0.35em]" />
          </label>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "กำลังตรวจสอบ..." : "ยืนยันและลงทะเบียน"}</button>
        </form>
        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="mt-4 w-full text-sm font-semibold text-gray-400">ออกจากระบบ LINE</button>
      </div>
    </div>
  );
}

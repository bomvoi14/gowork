"use client";

import { FormEvent, useState } from "react";
import { signOut } from "next-auth/react";

type Employee = { empId: string; name: string };

export function AccountRegistration({ onRegistered }: { onRegistered: () => void }) {
  const [empId, setEmpId] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setEmployee(null);
    if (!/^\d{1,12}$/.test(empId)) return setError("กรุณากรอกเลขประจำตัวเป็นตัวเลขให้ถูกต้อง");
    setBusy(true);
    try {
      const response = await fetch("/api/account/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId }),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) return setError(result?.error || "ไม่สามารถตรวจสอบเลขประจำตัวได้");
      setEmployee(result.employee);
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!employee || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: employee.empId, confirmed: true }),
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
          <img src="/gtd-logo.png" alt="GTD-GoWork" className="mx-auto mb-4 h-24 w-24 object-contain" />
          <h1 className="text-xl font-bold text-gray-800">ลงทะเบียนเข้าใช้งานครั้งแรก</h1>
          <p className="mt-2 text-sm text-gray-500">กรอกเลขประจำตัวพนักงานเพื่อตรวจสอบข้อมูล</p>
        </div>
        {!employee ? (
          <form onSubmit={lookup} className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">เลขประจำตัวพนักงาน
              <input value={empId} onChange={(e) => { setEmpId(e.target.value.replace(/\D/g, "")); setError(""); }} inputMode="numeric" pattern="[0-9]*" autoComplete="off" maxLength={12} required className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-sm" />
            </label>
            {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "กำลังตรวจสอบ..." : "ตรวจสอบเลขประจำตัว"}</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm text-gray-600">เลขประจำตัว: <span className="font-bold text-gray-900">{employee.empId}</span></p>
              <p className="mt-2 text-sm text-gray-600">ชื่อ-นามสกุล</p>
              <p className="font-bold text-lg text-gray-900">{employee.name}</p>
            </div>
            <p className="text-center text-sm text-gray-600">ตรวจสอบชื่อ-นามสกุลตรงกับตัวคุณ<br />ก่อนยืนยัน</p>
            {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
            <button type="button" onClick={confirm} disabled={busy} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "กำลังลงทะเบียน..." : "ยืนยันว่าเป็นฉัน"}</button>
            <button type="button" disabled={busy} onClick={() => { setEmployee(null); setError(""); }} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 disabled:opacity-50">แก้ไขเลขประจำตัว</button>
          </div>
        )}
        <button type="button" disabled={cancelling || busy} onClick={() => { setCancelling(true); signOut({ callbackUrl: "/" }); }} className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-60">
          {cancelling ? "กำลังยกเลิก..." : "ยกเลิกการลงทะเบียน"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export function AccountRegistration({ onRegistered }: { onRegistered: () => void }) {
  const [empId, setEmpId] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [deliveryUnconfirmed, setDeliveryUnconfirmed] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setDiagnostic("");
    if (!/^\d+$/.test(empId)) return setError("กรุณากรอกเลขประจำตัวเป็นตัวเลขเท่านั้น");
    if (sentTo && secondsLeft <= 0) return setError("OTP หมดอายุ กรุณาขอรหัสใหม่");
    if (sentTo && !/^\d{6}$/.test(code)) return setError("กรุณากรอก OTP 6 หลัก");
    setBusy(true);
    const requesting = !sentTo;
    try {
      const response = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId, action: sentTo ? "verify" : "request", code }),
      });
      const result = await response.json();
      if (result?.diagnostic) {
        const info = result.diagnostic;
        setDiagnostic([info.phase, info.state || info.reason].filter(Boolean).join(" / "));
      }
      if (!response.ok) {
        if (requesting && response.status >= 500) {
          return setError("ยังยืนยันการส่ง OTP ไม่สำเร็จ กรุณาตรวจอีเมลก่อน หากได้รับรหัสแล้วให้รอสักครู่และกดขอ OTP อีกครั้ง ระบบจะใช้รหัสเดิมที่ยังไม่หมดอายุ");
        }
        return setError(result?.error || "ไม่สามารถลงทะเบียนได้");
      }
      if (requesting) { setSentTo(result.email); setExpiresAt(result.expiresAt || Date.now() + 180000); setDeliveryUnconfirmed(false); return; }
      onRegistered();
    } catch {
      if (requesting) {
        setError("การเชื่อมต่อขัดข้อง ยังยืนยันการส่ง OTP ไม่ได้ กรุณาลองกดขอ OTP อีกครั้ง ระบบจะไม่ส่งรหัสซ้ำถ้ารหัสเดิมยังใช้งานได้");
      } else {
        setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
      }
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
            <p className="text-sm text-gray-600">{deliveryUnconfirmed ? "ยังยืนยันผลการส่งไม่ได้ หากได้รับอีเมลแล้ว ให้กรอกรหัสด้านล่าง (ไม่ต้องขอซ้ำ)" : "ส่งรหัส OTP แล้ว"} <strong>{sentTo}</strong></p>
            <p className="text-sm font-bold text-center">{secondsLeft > 0 ? `รหัสหมดอายุใน ${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}` : "รหัสหมดอายุแล้ว สามารถขอรหัสใหม่ได้"}</p>
            <label className="block text-sm font-bold text-gray-700">รหัส OTP 6 หลัก
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="mt-1.5 w-full rounded-xl border-2 border-gray-200 p-3 text-center text-lg font-bold tracking-[0.35em]" />
            </label>
            <button type="button" className="text-sm text-green-700 underline disabled:opacity-40" disabled={secondsLeft > 0 || busy} onClick={() => { setSentTo(""); setCode(""); setError(""); setDeliveryUnconfirmed(false); setExpiresAt(0); }}>ขอ OTP ใหม่ / เปลี่ยนเลขประจำตัว</button>
          </>}
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
          {diagnostic && <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">Staging Diagnostics: <span className="font-mono">{diagnostic}</span></div>}
          <button type="submit" disabled={busy || (Boolean(sentTo) && secondsLeft <= 0)} className="w-full rounded-xl bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "กำลังตรวจสอบ..." : sentTo ? "ยืนยัน OTP และลงทะเบียน" : "ส่ง OTP ไปยังอีเมลองค์กร"}</button>
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

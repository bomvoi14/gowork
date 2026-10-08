import "server-only";
import { createHmac, randomBytes } from "node:crypto";

function config() {
  const url = process.env.OTP_SCRIPT_URL || "";
  const secret = process.env.OTP_SCRIPT_SECRET || "";
  if (!url.startsWith("https://script.google.com/macros/s/") || secret.length < 32) {
    throw new Error("OTP_NOT_CONFIGURED");
  }
  return { url, secret };
}

export async function otpScript(action: "request" | "verify", lineUserId: string, empId: string, code?: string) {
  const { url, secret } = config();
  const nonce = randomBytes(16).toString("hex");
  const timestamp = String(Date.now());
  const payload = { action, lineUserId, empId, code: code || "", nonce, timestamp };
  const message = [action, lineUserId, empId, code || "", nonce, timestamp].join("\n");
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...payload, signature }),
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("OTP_DELIVERY_FAILED");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result)) throw new Error("OTP_INVALID_RESPONSE");
  return result as { ok: boolean; error?: string };
}

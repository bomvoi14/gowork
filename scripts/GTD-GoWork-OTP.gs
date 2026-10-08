/**
 * GTD-GoWork OTP gateway. Deploy as Apps Script Web App:
 * execute as Me; access Anyone. Requests require HMAC shared secret.
 * Set Script Property OTP_SCRIPT_SECRET (64+ random characters).
 * IMPORTANT: Apps Script Properties have storage limits; suitable for staging only.
 */
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_LIMIT = 5;

function hex_(bytes) {
  return bytes.map(b => ("0" + (b & 255).toString(16)).slice(-2)).join("");
}
function mac_(value, secret) {
  return hex_(Utilities.computeHmacSha256Signature(value, secret));
}
function equal_(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ok:false,error:"BUSY"});
  try {
    const body = JSON.parse(e.postData.contents);
    const {action,lineUserId,empId,code,nonce,timestamp,signature} = body;
    const secret = PropertiesService.getScriptProperties().getProperty("OTP_SCRIPT_SECRET");
    if (!secret || secret.length < 32) throw Error("NOT_CONFIGURED");
    if (!["request","verify"].includes(action) || !/^\d{1,12}$/.test(empId) ||
        typeof lineUserId !== "string" || !lineUserId || lineUserId.length > 256 ||
        typeof nonce !== "string" || !/^[a-f0-9]{32}$/.test(nonce) ||
        !/^\d{13}$/.test(String(timestamp)) || Math.abs(Date.now()-Number(timestamp)) > 60000) {
      return json_({ok:false,error:"INVALID_REQUEST"});
    }
    const message = [action,lineUserId,empId,code || "",nonce,String(timestamp)].join("\n");
    if (!equal_(mac_(message,secret),String(signature||""))) return json_({ok:false,error:"UNAUTHORIZED"});
    const props = PropertiesService.getScriptProperties();
    const nonceKey = "nonce:"+nonce;
    if (props.getProperty(nonceKey)) return json_({ok:false,error:"REPLAY"});
    props.setProperty(nonceKey,String(Date.now()));
    const key = "otp:"+mac_(lineUserId+"|"+empId,secret);
    const now = Date.now();
    const existing = JSON.parse(props.getProperty(key)||"null");
    if (action === "request") {
      if (existing && now-existing.sentAt < OTP_COOLDOWN_MS) return json_({ok:false,error:"WAIT_BEFORE_RESEND"});
      if (existing && existing.blockedUntil > now) return json_({ok:false,error:"TOO_MANY_ATTEMPTS"});
      const otp = String(Math.floor(Math.random()*1000000)).padStart(6,"0");
      // Apps Script has no cryptographic random API; use UUID entropy to derive OTP instead.
      const secureCode = String(parseInt(mac_(Utilities.getUuid()+Utilities.getUuid(),secret).slice(0,12),16)%1000000).padStart(6,"0");
      const hash = mac_(secureCode+"|"+lineUserId+"|"+empId,secret);
      props.setProperty(key,JSON.stringify({hash,sentAt:now,expiresAt:now+OTP_TTL_MS,attempts:0,blockedUntil:0}));
      try {
        GmailApp.sendEmail(empId+"@egat.co.th","GTD-GoWork | รหัสยืนยันตัวตน", "รหัส OTP ของคุณคือ "+secureCode+"\nรหัสมีอายุ 5 นาที และใช้ได้ครั้งเดียว\nหากคุณไม่ได้ร้องขอ โปรดละเว้นข้อความนี้", {name:"GTD-GoWork Security"});
      } catch (err) {
        props.deleteProperty(key);
        throw err;
      }
      return json_({ok:true});
    }
    if (!/^\d{6}$/.test(String(code||"")) || !existing || now > existing.expiresAt ||
        existing.attempts >= OTP_LIMIT || existing.blockedUntil > now) return json_({ok:false,error:"INVALID_OR_EXPIRED"});
    existing.attempts++;
    if (!equal_(mac_(code+"|"+lineUserId+"|"+empId,secret),existing.hash)) {
      if (existing.attempts >= OTP_LIMIT) existing.blockedUntil = now+15*60*1000;
      props.setProperty(key,JSON.stringify(existing));
      return json_({ok:false,error:"INVALID_OR_EXPIRED"});
    }
    props.deleteProperty(key);
    return json_({ok:true});
  } catch (err) {
    console.error(String(err));
    return json_({ok:false,error:"SERVICE_ERROR"});
  } finally { lock.releaseLock(); }
}

import "server-only";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const ACCOUNT_SPREADSHEET_ID = process.env.GOOGLE_ACCOUNT_SPREADSHEET_ID || "";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("Missing server configuration");
  return value;
}

export function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      project_id: required("GOOGLE_PROJECT_ID"),
      client_email: required("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
      private_key: required("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function readEmployeeMasterSample() {
  if (!SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'ข้อมูล_อบค.'!B2:D6",
  });
  return response.data.values ?? [];
}

export async function findLineEmployee(lineUserId: string) {
  if (!ACCOUNT_SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'LINE_พนักงาน'!A2:I",
  });
  const rows = response.data.values ?? [];
  const matches = rows.filter((row) => String(row[3] || "").trim() === lineUserId);
  if (!matches.length) return null;

  const row = matches[matches.length - 1];
  return {
    empId: String(row[1] || "").trim(),
    name: String(row[2] || "").trim(),
    status: String(row[5] || "").trim().toLowerCase(),
    role: String(row[8] || "user").trim().toLowerCase() === "admin" ? "admin" : "user",
  };
}


export async function findEmployeeForRegistration(empId: string) {
  if (!SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'ข้อมูล_อบค.'!B2:D",
  });
  const rows = response.data.values ?? [];
  const row = rows.find((item) => String(item[0] || "").trim() === empId);
  if (!row) return null;
  return {
    empId: String(row[0] || "").trim(),
    name: String(row[1] || "").trim(),
    englishName: String(row[2] || "").trim(),
  };
}

export async function findActiveMappingByEmpId(empId: string) {
  if (!ACCOUNT_SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'LINE_พนักงาน'!A2:H",
  });
  const rows = response.data.values ?? [];
  return rows.some(
    (row) =>
      String(row[1] || "").trim() === empId &&
      String(row[5] || "").trim().toLowerCase() === "active"
  );
}

export async function createLineEmployeeMapping(input: {
  empId: string;
  name: string;
  lineUserId: string;
  lineName: string;
}) {
  if (!ACCOUNT_SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();

  const existingLine = await findLineEmployee(input.lineUserId);
  if (existingLine) throw new Error("LINE_ALREADY_BOUND");
  if (await findActiveMappingByEmpId(input.empId)) throw new Error("EMPLOYEE_ALREADY_BOUND");

  await sheets.spreadsheets.values.append({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'LINE_พนักงาน'!A:H",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[
        new Date().toISOString(),
        input.empId,
        input.name,
        input.lineUserId,
        input.lineName,
        "Active",
        new Date().toISOString(),
        "ลงทะเบียนผ่าน GTD-GoWork Security V1",
      ]],
    },
  });
}


export async function readPrivateWorkData() {
  if (!SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'ชีต1'!A:Z",
  });
  return response.data.values ?? [];
}


export async function updateEmployeeProfile(input: {
  empId: string;
  editCraft: string;
  editPhone: string;
  editedBy: string;
}) {
  if (!SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();

  const detail = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'รายละเอียด'!A:Z",
  });
  const rows = detail.data.values ?? [];
  const matchingRows = rows
    .map((row, index) => ({ row, sheetRow: index + 1 }))
    .filter(({ row }) => {
      return String(row[0] || "").trim() === input.empId;
    });

  if (!matchingRows.length) throw new Error("EMPLOYEE_NOT_FOUND");

  const data = matchingRows.flatMap(({ sheetRow }) => [
    { range: `'รายละเอียด'!I${sheetRow}`, values: [[input.editCraft]] },
    { range: `'รายละเอียด'!J${sheetRow}`, values: [[input.editPhone]] },
  ]);
  data.push({
    range: "'รายละเอียด'!Z1",
    values: [[new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })]],
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: "RAW", data },
  });

  if (ACCOUNT_SPREADSHEET_ID) {
    try {
      const employeeName = String(matchingRows[0]?.row?.[1] || "").trim();
      const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
      await sheets.spreadsheets.values.append({
        spreadsheetId: ACCOUNT_SPREADSHEET_ID,
        range: "'แจ้งแก้ไข'!A:G",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [[
            timestamp,
            input.empId,
            employeeName,
            input.editCraft,
            input.editPhone,
            input.editedBy,
            "อัปเดตสำเร็จ " + matchingRows.length + " แถว",
          ]],
        },
      });
    } catch (auditError) {
      console.error("Edit audit log failed:", auditError);
    }
  }
}


export async function appendLoginAudit(input: {
  lineUserId: string;
  lineName: string;
  lineImage: string;
}) {
  if (!ACCOUNT_SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  await sheets.spreadsheets.values.append({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'ประวัติ Login'!A:E",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[timestamp, input.lineUserId, input.lineName, input.lineImage, "Login"]],
    },
  });
}


const LINKED_ACCOUNTS_SHEET = "บัญชีเชื่อมต่อ";

async function ensureLinkedAccountsSheet() {
  if (!ACCOUNT_SPREADSHEET_ID) throw new Error("Missing server configuration");
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    fields: "sheets.properties.title",
  });
  const exists = (meta.data.sheets || []).some((sheet) => sheet.properties?.title === LINKED_ACCOUNTS_SHEET);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: ACCOUNT_SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: LINKED_ACCOUNTS_SHEET } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: ACCOUNT_SPREADSHEET_ID,
      range: "'" + LINKED_ACCOUNTS_SHEET + "'!A1:H1",
      valueInputOption: "RAW",
      requestBody: { values: [["วันที่เชื่อม", "EmpID", "Provider", "Provider ID", "Email", "ชื่อบัญชี", "สถานะ", "วันที่เปลี่ยนสถานะ"]] },
    });
  }
}

export async function getLinkedGoogleAccount(empId: string) {
  await ensureLinkedAccountsSheet();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'" + LINKED_ACCOUNTS_SHEET + "'!A2:H",
  });
  const rows = response.data.values ?? [];
  const matches = rows.filter((row) =>
    String(row[1] || "").trim() === empId &&
    String(row[2] || "").trim().toLowerCase() === "google" &&
    String(row[6] || "").trim().toLowerCase() === "active"
  );
  if (!matches.length) return null;
  const row = matches[matches.length - 1];
  return { providerId: String(row[3] || ""), email: String(row[4] || ""), name: String(row[5] || "") };
}

export async function linkGoogleAccount(input: { empId: string; providerId: string; email: string; name: string }) {
  await ensureLinkedAccountsSheet();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'" + LINKED_ACCOUNTS_SHEET + "'!A2:H",
  });
  const rows = response.data.values ?? [];
  const providerUsedByOtherEmployee = rows.some((row) =>
    String(row[2] || "").trim().toLowerCase() === "google" &&
    String(row[3] || "").trim() === input.providerId &&
    String(row[6] || "").trim().toLowerCase() === "active" &&
    String(row[1] || "").trim() !== input.empId
  );
  if (providerUsedByOtherEmployee) throw new Error("GOOGLE_ALREADY_BOUND");

  const alreadyLinked = rows.some((row) =>
    String(row[1] || "").trim() === input.empId &&
    String(row[2] || "").trim().toLowerCase() === "google" &&
    String(row[6] || "").trim().toLowerCase() === "active"
  );
  if (alreadyLinked) throw new Error("EMPLOYEE_GOOGLE_ALREADY_BOUND");

  const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  await sheets.spreadsheets.values.append({
    spreadsheetId: ACCOUNT_SPREADSHEET_ID,
    range: "'" + LINKED_ACCOUNTS_SHEET + "'!A:H",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[now, input.empId, "google", input.providerId, input.email, input.name, "Active", now]] },
  });
}


export async function getLinkedFacebookAccount(empId: string) {
  await ensureLinkedAccountsSheet();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SPREADSHEET_ID, range: "'" + LINKED_ACCOUNTS_SHEET + "'!A2:H" });
  const rows = response.data.values ?? [];
  const matches = rows.filter((row) => String(row[1] || "").trim() === empId && String(row[2] || "").trim().toLowerCase() === "facebook" && String(row[6] || "").trim().toLowerCase() === "active");
  if (!matches.length) return null;
  const row = matches[matches.length - 1];
  return { providerId: String(row[3] || ""), email: String(row[4] || ""), name: String(row[5] || "") };
}

export async function linkFacebookAccount(input: { empId: string; providerId: string; email: string; name: string }) {
  await ensureLinkedAccountsSheet();
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: ACCOUNT_SPREADSHEET_ID, range: "'" + LINKED_ACCOUNTS_SHEET + "'!A2:H" });
  const rows = response.data.values ?? [];
  if (rows.some((row) => String(row[2] || "").trim().toLowerCase() === "facebook" && String(row[3] || "").trim() === input.providerId && String(row[6] || "").trim().toLowerCase() === "active" && String(row[1] || "").trim() !== input.empId)) throw new Error("FACEBOOK_ALREADY_BOUND");
  if (rows.some((row) => String(row[1] || "").trim() === input.empId && String(row[2] || "").trim().toLowerCase() === "facebook" && String(row[6] || "").trim().toLowerCase() === "active")) throw new Error("EMPLOYEE_FACEBOOK_ALREADY_BOUND");
  const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  await sheets.spreadsheets.values.append({ spreadsheetId: ACCOUNT_SPREADSHEET_ID, range: "'" + LINKED_ACCOUNTS_SHEET + "'!A:H", valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS", requestBody: { values: [[now, input.empId, "facebook", input.providerId, input.email, input.name, "Active", now]] } });
}

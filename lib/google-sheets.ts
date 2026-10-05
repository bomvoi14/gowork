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
      const candidates = [row[0], row[1], row[8]].map((value) => String(value || "").trim());
      return candidates.includes(input.empId);
    });

  if (!matchingRows.length) throw new Error("EMPLOYEE_NOT_FOUND");

  const data = matchingRows.flatMap(({ sheetRow }) => [
    { range: `'รายละเอียด'!L${sheetRow}`, values: [[input.editCraft]] },
    { range: `'รายละเอียด'!K${sheetRow}`, values: [[input.editPhone]] },
  ]);
  data.push({
    range: "'รายละเอียด'!Z1",
    values: [[new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })]],
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { valueInputOption: "RAW", data },
  });
}

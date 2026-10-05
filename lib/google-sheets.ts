import "server-only";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";

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

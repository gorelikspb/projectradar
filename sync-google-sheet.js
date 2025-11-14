import fs from 'fs/promises';
import { google } from 'googleapis';

const dashboardUrl = new URL('./docs/dashboard.json', import.meta.url);
const HEADER = ['project', 'repo', 'status', 'last_update', 'next_focus', 'manual_note'];
const HEADER_RANGE = process.env.GOOGLE_SHEET_HEADER_RANGE ?? 'Radar!A1:F1';
const DATA_RANGE = process.env.GOOGLE_SHEET_RANGE ?? 'Radar!A2:F';

const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

if (!serviceAccountJson || !spreadsheetId) {
  console.log('Google Sheets переменные не заданы — шаг пропущен.');
  process.exit(0);
}

const creds = JSON.parse(serviceAccountJson);
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const dashboard = JSON.parse(await fs.readFile(dashboardUrl, 'utf8'));

const existing = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: DATA_RANGE
});

const existingRows = existing.data.values ?? [];
const noteIndex = new Map();

for (const row of existingRows) {
  const [project = '', repo = '', , , , manualNote = ''] = row;
  if (!project && !repo) continue;
  noteIndex.set(`${project}::${repo}`, manualNote);
}

const newRows = dashboard.map(item => {
  const key = `${item.project || ''}::${item.repo || ''}`;
  return [
    item.project || '',
    item.repo || '',
    item.status || '',
    item.last_update || '',
    item.next_focus || '',
    noteIndex.get(key) || ''
  ];
});

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: HEADER_RANGE,
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] }
});

await sheets.spreadsheets.values.clear({
  spreadsheetId,
  range: DATA_RANGE
});

if (newRows.length) {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: DATA_RANGE,
    valueInputOption: 'RAW',
    requestBody: { values: newRows }
  });
}

console.log(`Google Sheet обновлён, строк: ${newRows.length}`);


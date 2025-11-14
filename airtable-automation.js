/**
 * Airtable Automation Script (Script Action)
 *
 * Таблица должна иметь поля:
 *   project, repo, status, last_update, next_focus, manual_note
 * Поле manual_note редактируется вручную и скрипт его не трогает.
 *
 * Перед запуском:
 *   1. Вставь актуальный URL GitHub Pages с dashboard.json.
 *   2. Выбери Automation → Run.
 */

const TABLE_NAME = 'Projects Radar';
const DASHBOARD_URL = 'https://<user>.github.io/projects-radar/dashboard.json';

const res = await fetch(`${DASHBOARD_URL}?ts=${Date.now()}`);
if (!res.ok) {
  throw new Error(`Не удалось загрузить dashboard: ${res.status} ${res.statusText}`);
}
const dashboard = await res.json();

const table = base.getTable(TABLE_NAME);
const existing = await table.selectRecordsAsync({ fields: ['project', 'repo', 'manual_note'] });
const existingIndex = new Map(
  existing.records.map(record => {
    const project = record.getCellValueAsString('project');
    const repo = record.getCellValueAsString('repo');
    return [`${project}::${repo}`, record];
  })
);

const updates = [];
const creates = [];

for (const row of dashboard) {
  const key = `${row.project}::${row.repo}`;
  const match = existingIndex.get(key);
  const fields = {
    project: row.project || '',
    repo: row.repo || '',
    status: row.status || '',
    last_update: row.last_update || '',
    next_focus: row.next_focus || ''
  };

  if (match) {
    updates.push({ id: match.id, fields });
  } else {
    creates.push({ fields });
  }
}

while (updates.length) {
  await table.updateRecordsAsync(updates.splice(0, 50));
}
while (creates.length) {
  await table.createRecordsAsync(creates.splice(0, 50));
}

output.set('synced', dashboard.length);


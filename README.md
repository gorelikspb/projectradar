# Projects Radar

Лёгкий агрегатор для `PROJECTS_OVERVIEW.json` из разных репозиториев. Скрипт собирает всё в `dashboard.json`, GitHub Pages показывает таблицу, а Airtable позволяет вручную дописывать заметки.

## Как пользоваться

1. **Настрой источники**  
   По умолчанию `repos.json` включает авто-поиск: берём все публичные репозитории пользователя `gorelikspb`, обновлявшиеся за последние 30 дней и содержащие `PROJECTS_OVERVIEW.json`. Если нужен свой логин или ручные репо, поменяй `autoDiscover.user`, `lookbackDays` и список `manual`.

2. **Локальный запуск**  
   ```bash
   npm install
   npm run collect
   npm run sync:sheet # опционально, если заданы GOOGLE_* переменные
   ```  
   Появится обновлённый `docs/dashboard.json`. Открой `docs/index.html` (или GitHub Pages) и увидишь список проектов.

3. **GitHub Pages + Actions**  
   - Включи GitHub Pages из ветки `main`, папка `/docs`.  
   - Секрет `PERSONAL_GITHUB_TOKEN` (если нужны приватные репо).  
   - Workflow `.github/workflows/sync.yml` можно запускать вручную с вкладки Actions или ждать расписания. Он соберёт dashboard, при наличии Google Sheets секретов дополнительно обновит таблицу и закоммитит `docs/`.
   - Файлы `docs/index.html` и `docs/dashboard.json` автоматически коммитятся в `main`, откуда их подхватывает Pages.

4. **Google Sheets (без платных тарифов)**  
   - Создай Google Spreadsheet, добавь лист `Radar` (или другой, но тогда задай `GOOGLE_SHEET_RANGE`).  
   - В шапке строки 1 должны быть столбцы: `project`, `repo`, `status`, `last_update`, `next_focus`, `manual_note` — их можно вставить руками или доверить скрипту.  
   - Создай сервис-аккаунт в Google Cloud (Sheets API), сгенерируй JSON-ключ.  
   - В репозитории GitHub добавь секреты:
     - `GOOGLE_SERVICE_ACCOUNT_JSON` — полный JSON ключа (как строку).
     - `GOOGLE_SHEET_ID` — ID таблицы (часть URL между `/d/` и `/edit`).  
   - Шерни саму таблицу на e-mail сервис-аккаунта, чтобы у него был доступ `Editor`.  
   - После этого workflow `Sync Projects Radar` автоматически заполнит таблицу данными из `docs/dashboard.json`. Колонку `manual_note` редактируй вручную — скрипт её не перезаписывает.

5. **Airtable (опционально, если есть Automation)**  
   - Импортируй `airtable-template.csv` и используй `airtable-automation.js` в Script Action (требуется тариф с автоматизациями).  

## Поток обновлений

1. Запуск `collect.js` (локально или через GitHub Action) → `docs/dashboard.json`.
2. `docs/index.html` на GitHub Pages показывает таблицу + кнопку «Обновить данные».  
3. GitHub Action (или `npm run sync:sheet`) обновляет Google Sheet, оставляя ручные заметки. (При желании можно дополнительно использовать Airtable.)

Минимум инфраструктуры: только GitHub и Airtable/Notion, никаких отдельных серверов.

## Что сделать тебе (короткая инструкция)
1. **Залей репозиторий на GitHub** и включи Pages с папки `docs` (или оставь как есть, если используешь ветку `gh-pages`).  
2. **Подготовь Google Sheet**: создай таблицу (лист `Radar`), вставь строку с заголовками или дай это сделать скрипту, расшарь на сервис-аккаунт.  
3. **Добавь секреты** `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID` (и при необходимости `PERSONAL_GITHUB_TOKEN`) в `Settings → Secrets → Actions`.  
4. **Запусти workflow `Sync Projects Radar`** вручную или жди расписания. Он соберёт `docs/dashboard.json`, обновит Google Sheet и закоммитит изменения для GitHub Pages.  
5. **На GitHub Pages/в Google Sheets** нажми «Обновить»/внеси заметку. Колонка `manual_note` редактируется вручную, данные от скрипта её не перезаписывают.


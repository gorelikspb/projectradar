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
   - Workflow `.github/workflows/sync.yml` можно запускать вручную с вкладки Actions или ждать расписания. Он соберёт dashboard, подтянет заметки из `manual-notes.json`, опционально обновит Google Sheet и закоммитит `docs/`.
   - Файлы `docs/index.html` и `docs/dashboard.json` автоматически коммитятся в `main`, откуда их подхватывает Pages.

4. **Ручные заметки (без внешних сервисов)**  
   - Открой `manual-notes.json`. Формат записи:
     ```json
     [
       { "owner": "gorelikspb", "repo": "printacopy", "project": "MVP Launch", "manual_note": "Проверить печать..." }
     ]
     ```
   - Добавь/измени записи напрямую в GitHub (кнопка “Edit this file”) или локально с коммитом.  
   - При следующем запуске `npm run collect` (или GitHub Action) заметки автоматически попадают в `docs/dashboard.json` и на страницу радара в колонку «Заметка».

5. **Google Sheets (опционально)**  
   - Если хочешь иметь отдельную таблицу, настрой сервис-аккаунт и секреты `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`.  
   - Шаг `npm run sync:sheet` (и соответствующий Action) перенесёт текущий dashboard в выбранную таблицу, но `manual_note` по-прежнему редактируется вручную в JSON и не перезаписывается.  
   - Этот этап можно пропустить, если достаточно GitHub Pages + `manual-notes.json`.

6. **Airtable (опционально, если есть Automation)**  
   - Импортируй `airtable-template.csv` и используй `airtable-automation.js` в Script Action (требуется тариф с автоматизациями).

## Поток обновлений

1. Запуск `collect.js` (локально или через GitHub Action) → `docs/dashboard.json`.
2. `docs/index.html` на GitHub Pages показывает таблицу + кнопку «Обновить данные» и колонку «Заметка».  
3. `manual-notes.json` хранит ручные пометки прямо в репозитории (история правок — в git).  
4. GitHub Action (или `npm run sync:sheet`) при необходимости обновляет Google Sheet / Airtable.

Минимум инфраструктуры: только GitHub и Airtable/Notion, никаких отдельных серверов.

## Что сделать тебе (короткая инструкция)
1. **Залей репозиторий на GitHub** и включи Pages с папки `docs` (или оставь как есть, если используешь ветку `gh-pages`).  
2. **Отредактируй `manual-notes.json`**: добавь свои заметки (можно прямо в GitHub UI → “Edit this file”).  
3. (Опционально) **Подготовь Google Sheet** и добавь секреты `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`, если нужна синхронизация в таблицу.  
4. **Запусти workflow `Sync Projects Radar`** вручную или жди расписания. Он соберёт `docs/dashboard.json`, подхватит `manual-notes.json`, при наличии секретов обновит Google Sheet и закоммитит изменения для GitHub Pages.  
5. **На GitHub Pages** нажми «Обновить данные» и увидишь актуальные метрики + свои заметки. При необходимости повтори шаг 2, чтобы обновить комментарии.


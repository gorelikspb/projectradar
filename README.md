# Projects Radar

Лёгкий агрегатор для `PROJECTS_OVERVIEW.json` из разных репозиториев. Скрипт собирает всё в `dashboard.json`, GitHub Pages показывает таблицу, а Airtable позволяет вручную дописывать заметки.

## Как пользоваться

1. **Настрой источники**  
   По умолчанию `repos.json` включает авто-поиск: берём все публичные репозитории пользователя `gorelikspb`, обновлявшиеся за последние 30 дней и содержащие `PROJECTS_OVERVIEW.json`. Если нужен свой логин или ручные репо, поменяй `autoDiscover.user`, `lookbackDays` и список `manual`.

2. **Локальный запуск**  
   ```bash
   npm install
   npm run collect
   ```  
   Появится обновлённый `docs/dashboard.json`. Открой `docs/index.html` (или GitHub Pages) и увидишь список проектов.

3. **GitHub Pages + Actions**  
   - Включи GitHub Pages из ветки `main`, папка `/docs`.  
   - Секрет `PERSONAL_GITHUB_TOKEN` (если нужны приватные репо).  
  - Workflow `.github/workflows/sync.yml` можно запускать вручную с вкладки Actions или ждать расписания. Он соберёт dashboard и закоммитит обновлённые файлы в `main` (папка `docs/`), откуда их сразу подхватывает Pages.
   - Файлы `docs/index.html` и `docs/dashboard.json` автоматически коммитятся в `main`, откуда их подхватывает Pages.

4. **Airtable (по желанию)**  
   - Импортируй `airtable-template.csv` в новую таблицу `Projects Radar` (`Add table → Import → CSV`). Укажи типы полей как Single line text, а `manual_note` — Long text.  
   - Настрой Automation: `Create automation → + Action → Run script`, вставь код из `airtable-automation.js`, замени `DASHBOARD_URL` на свой GitHub Pages URL.  
   - На вкладке `Run` появится кнопка: нажимаешь — таблица подтянет свежий `dashboard.json`, а поле `manual_note` останется с твоими ручными правками.

## Поток обновлений

1. Запуск `collect.js` (локально или через GitHub Action) → `docs/dashboard.json`.
2. `docs/index.html` на GitHub Pages показывает таблицу + кнопку «Обновить данные».  
3. Airtable Automation забирает `dashboard.json` и синхронизирует таблицу, оставляя ручные комментарии.

Минимум инфраструктуры: только GitHub и Airtable/Notion, никаких отдельных серверов.

## Что сделать тебе (короткая инструкция)
1. **Залей репозиторий на GitHub** и включи Pages с папки `docs` (или оставь как есть, если используешь ветку `gh-pages`).  
2. **Импортируй Airtable-шаблон**: скачай `airtable-template.csv`, в Airtable выбери `Create → Import data → CSV`, назначь типы полей.  
3. **Вставь Automation Script** из `airtable-automation.js`, пропиши свой `DASHBOARD_URL` и при необходимости добавь `GITHUB_TOKEN` в `Secrets`.  
4. **Запусти workflow `Sync Projects Radar`** вручную на GitHub (Actions → выбери workflow → Run) или жди расписания.  
5. **На GitHub Pages/в Airtable** нажми «Обновить» / `Run` и увидишь актуальные проекты; поле `manual_note` редактируешь вручную, оно не перезаписывается.


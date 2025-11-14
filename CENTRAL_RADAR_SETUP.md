# Центральный радар проектов (Cursor Setup)

Используй эти шаги, когда нужно собрать данные из всех репозиториев и вывести в единый «радар» (Notion/Airtable/другое).

## 1. Что есть в проектах
- Каждый проект содержит `PROJECTS_OVERVIEW.json` в корне.
- Формат: массив объектов `{ project, status, last_update, done[], next_focus }`.
- В `.gitignore` это не спрятано — файл доступен через GitHub raw.

## 2. Что нужно сделать ассистенту
1. Создать отдельный репозиторий, например `projects-radar`.
2. Добавить туда:
   - `repos.json` — список репозиториев:
     ```json
     [
       { "owner": "gorelikspb", "repo": "printacopy" }
     ]
     ```
   - `collect.js` — статичный Node.js скрипт:
     ```javascript
     import fs from 'fs/promises';
     import fetch from 'node-fetch'; // Node <18 — не забудь `npm install node-fetch`

     const repos = JSON.parse(await fs.readFile('repos.json', 'utf8'));
     const aggregated = [];

     for (const { owner, repo } of repos) {
       const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/PROJECTS_OVERVIEW.json`;
       try {
         const res = await fetch(url);
         if (!res.ok) throw new Error(res.statusText);
         const data = await res.json();
         aggregated.push(...data.map(entry => ({ ...entry, repo })));
       } catch (error) {
         console.error(`Не удалось получить ${repo}: ${error.message}`);
       }
     }

     await fs.writeFile('dashboard.json', JSON.stringify(aggregated, null, 2));
     console.log(`Собрано проектов: ${aggregated.length}`);
     ```
   - `package.json` с `"type": "module"` (если используем `import`) и `node-fetch` в зависимостях при необходимости.

3. Запуск:
   ```bash
   node collect.js
   ```
   Скрипт сохраняет `dashboard.json` — его можно импортировать в Notion/Airtable вручную или через API.

## 3. Интеграция с Notion/Airtable (опционально)
- **Notion**: добавить `notion-sdk-js`, сделать upsert в базу (ID и токен задаём через `.env`).
- **Airtable**: использовать Airtable Automation → Script (можно вставить тот же код, только заменить `fs` на `output.set`).
- **Automation**: позже перенести в GitHub Actions (`on: schedule`) для регулярного обновления.

## 4. Что важно помнить
- `instructions/` и `PROJECT_LOG.md` никогда не идут в публичные репо, поэтому центральный скрипт их не ищет.
- `PROJECTS_OVERVIEW.json` — единственный файл, который гарантированно доступен.
- Список репозиториев (`repos.json`) нужен, чтобы не тянуть всё подряд из GitHub.

Используй эту инструкцию при запуске отдельного проекта-агрегатора. Туториал рассчитан на статичный JavaScript и простой деплой (локальный запуск или GitHub Actions).


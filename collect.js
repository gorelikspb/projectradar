import fs from 'fs/promises';
import fetch from 'node-fetch';

const configUrl = new URL('./repos.json', import.meta.url);
const notesUrl = new URL('./manual-notes.json', import.meta.url);
const docsDashboardUrl = new URL('./docs/dashboard.json', import.meta.url);
const docsDirUrl = new URL('./docs/', import.meta.url);

const apiHeaders = {
  'User-Agent': 'projects-radar-script',
  Accept: 'application/vnd.github+json'
};
const rawHeaders = {};

if (process.env.GITHUB_TOKEN) {
  apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  rawHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const config = JSON.parse(await fs.readFile(configUrl, 'utf8'));
const manualRepos = Array.isArray(config) ? config : config.manual ?? [];
let repoList = [...manualRepos];

if (!Array.isArray(config) && config.autoDiscover?.user) {
  const discovered = await discoverRepos(config.autoDiscover);
  repoList = [
    ...discovered,
    ...manualRepos
  ];
}

let manualNotes = [];

try {
  manualNotes = JSON.parse(await fs.readFile(notesUrl, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') {
    console.warn('Не удалось прочитать manual-notes.json:', error.message);
  }
}

const notesIndex = new Map(
  manualNotes
    .filter(Boolean)
    .map(note => {
      const key = `${note.owner || ''}/${note.repo || ''}::${note.project || ''}`;
      return [key, note.manual_note ?? note.note ?? ''];
    })
);

const aggregated = [];

if (!repoList.length) {
  console.log('Нет репозиториев для обработки — проверь config/repos.');
}

for (const { owner, repo, branch = 'main' } of repoList) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/PROJECTS_OVERVIEW.json`;
  try {
    const res = await fetch(url, { headers: rawHeaders });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    aggregated.push(
      ...data.map(entry => {
        const key = `${owner}/${repo}::${entry.project || ''}`;
        return {
          ...entry,
          repo,
          owner,
          source_url: `https://github.com/${owner}/${repo}`,
          manual_note: notesIndex.get(key) || ''
        };
      })
    );
    console.log(`✔ ${owner}/${repo}: ${data.length} записей`);
  } catch (error) {
    console.error(`✖ Не удалось получить ${owner}/${repo}: ${error.message}`);
  }
}

await fs.mkdir(docsDirUrl, { recursive: true });
await fs.writeFile(docsDashboardUrl, JSON.stringify(aggregated, null, 2));
console.log(`Всего собрано проектов: ${aggregated.length}`);

async function discoverRepos({ user, lookbackDays = 30 }) {
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const url = new URL(`https://api.github.com/users/${user}/repos`);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('sort', 'pushed');
  url.searchParams.set('direction', 'desc');

  const res = await fetch(url, { headers: apiHeaders });
  if (!res.ok) {
    throw new Error(`Не удалось получить список репозиториев: ${res.status} ${res.statusText}`);
  }

  const repos = await res.json();
  const filtered = repos.filter(repo => {
    const pushed = new Date(repo.pushed_at).getTime();
    return pushed >= cutoff;
  });

  const result = [];

  for (const repo of filtered) {
    const branch = repo.default_branch ?? 'main';
    const checkUrl = `https://api.github.com/repos/${repo.full_name}/contents/PROJECTS_OVERVIEW.json?ref=${branch}`;
    const checkRes = await fetch(checkUrl, { headers: apiHeaders });
    if (checkRes.ok) {
      result.push({
        owner: repo.owner.login,
        repo: repo.name,
        branch
      });
      console.log(`◎ auto: ${repo.full_name} добавлен`);
    } else {
      console.log(`… auto: ${repo.full_name} пропущен (нет PROJECTS_OVERVIEW)`);
    }
  }

  return result;
}


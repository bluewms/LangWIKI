const fs = require('fs');
const path = require('path');

function listWikiFiles(rootDir) {
  const base = path.join(rootDir, '.LangWIKI');
  const files = [];

  const directFiles = ['index.md', 'log.md'];
  for (const name of directFiles) {
    const filePath = path.join(base, name);
    if (fs.existsSync(filePath)) files.push(filePath);
  }

  const entitiesDir = path.join(base, 'entities');
  if (fs.existsSync(entitiesDir)) {
    const entities = fs.readdirSync(entitiesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const entity of entities) {
      const entityPath = path.join(entitiesDir, entity.name, `${entity.name}-wiki.md`);
      if (fs.existsSync(entityPath)) files.push(entityPath);
    }
  }

  return files;
}

function normalize(text = '') {
  return String(text).toLowerCase();
}

function makeSnippet(content, keyword, radius = 60) {
  const raw = String(content || '');
  const idx = raw.indexOf(keyword);
  if (idx === -1) return raw.slice(0, Math.min(120, raw.length));
  const start = Math.max(0, idx - radius);
  const end = Math.min(raw.length, idx + keyword.length + radius);
  return raw.slice(start, end).replace(/\n+/g, ' ').trim();
}

function searchWiki(rootDir, query, options = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const qNorm = normalize(q);
  const entityFilter = options.entityName ? String(options.entityName) : null;
  const files = listWikiFiles(rootDir);

  const results = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const contentNorm = normalize(content);
    if (!contentNorm.includes(qNorm)) continue;

    if (entityFilter && !filePath.includes(`${path.sep}${entityFilter}${path.sep}`)) continue;

    results.push({
      file: path.relative(rootDir, filePath),
      snippet: makeSnippet(content, q),
      score: contentNorm.split(qNorm).length - 1
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, options.limit || 10);
}

module.exports = {
  listWikiFiles,
  searchWiki
};
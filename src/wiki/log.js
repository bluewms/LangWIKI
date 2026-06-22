const fs = require('fs');
const path = require('path');
const { ensureWikiRoot } = require('./index');

function appendLog(rootDir, entry = {}) {
  const wikiRoot = ensureWikiRoot(rootDir);
  const logPath = path.join(wikiRoot, 'log.md');

  const date = new Date().toISOString().slice(0, 10);
  const action = entry.action || 'event';
  const entity = entry.entity || '-';
  const lines = Array.isArray(entry.lines) ? entry.lines : [];

  const section = [
    `## [${date}] ${action} | ${entity}`,
    ...lines.map((line) => `- ${line}`),
    ''
  ].join('\n');

  fs.appendFileSync(logPath, `${section}\n`, 'utf-8');
  return section;
}

module.exports = {
  appendLog
};
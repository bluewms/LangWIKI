const fs = require('fs');
const path = require('path');

function ensureWikiRoot(rootDir) {
  const wikiRoot = path.join(rootDir, '.LangWIKI');
  fs.mkdirSync(wikiRoot, { recursive: true });
  return wikiRoot;
}

function updateIndex(rootDir, entities = [], syntheses = []) {
  const wikiRoot = ensureWikiRoot(rootDir);
  const indexPath = path.join(wikiRoot, 'index.md');

  const entityLines = entities.map((entity) => (
    `- [${entity.name}](${entity.wikiPath})${entity.summary ? ` — ${entity.summary}` : ''}`
  ));

  const synthesisLines = syntheses.map((item) => (
    `- [${item.name}](${item.path})${item.summary ? ` — ${item.summary}` : ''}`
  ));

  const content = [
    '# 客户资料知识库索引',
    '',
    `> 最后更新: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '## 实体',
    ...(entityLines.length ? entityLines : ['- （暂无实体）']),
    '',
    '## 综合',
    ...(synthesisLines.length ? synthesisLines : ['- （暂无综合页）']),
    ''
  ].join('\n');

  fs.writeFileSync(indexPath, content, 'utf-8');
  return content;
}

module.exports = {
  updateIndex,
  ensureWikiRoot
};
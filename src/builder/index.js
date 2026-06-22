const fs = require('fs');
const path = require('path');

const DEFAULT_AUTO_BLOCKS = ['AUTO:SUMMARY', 'AUTO:TIMELINE', 'AUTO:PAYMENTS', 'AUTO:RISKS'];

function createInitialWiki(entityName, entityType = '未知', sourceDir = '') {
  const now = new Date().toISOString();
  const autoBlocks = DEFAULT_AUTO_BLOCKS.map((name) => {
    const title = name.replace('AUTO:', '');
    return `<!-- ${name} -->\n## ${title}\n（待生成）\n<!-- /${name} -->`;
  }).join('\n\n');

  return `---
title: ${entityName}业务档案
entity_name: ${entityName}
entity_type: ${entityType}
updated_at: ${now}
source_dir: ${sourceDir}
---

# ${entityName}业务档案

<!-- MANUAL:NOTES -->
> 人工备注区（自由编辑，系统不会覆盖）

<!-- /MANUAL:NOTES -->

${autoBlocks}
`;
}

function replaceAutoBlock(content, blockName, blockValue) {
  const regex = new RegExp(`<!--\\s*${blockName}\\s*-->[\\s\\S]*?<!--\\s*\\/${blockName}\\s*-->`, 'm');
  const nextBlock = `<!-- ${blockName} -->\n${blockValue}\n<!-- /${blockName} -->`;

  if (regex.test(content)) {
    return content.replace(regex, nextBlock);
  }

  const trimmed = content.trimEnd();
  return `${trimmed}\n\n${nextBlock}\n`;
}

function updateWikiContent(existingWiki, autoBlocks = {}) {
  let output = existingWiki;

  for (const [blockName, blockValue] of Object.entries(autoBlocks)) {
    if (!blockName.startsWith('AUTO:')) continue;
    output = replaceAutoBlock(output, blockName, blockValue);
  }

  return output;
}

function getWikiPath(rootDir, entityName) {
  return path.join(rootDir, '.LangWIKI', 'entities', entityName, `${entityName}-wiki.md`);
}

function readWikiFile(rootDir, entityName) {
  const wikiPath = getWikiPath(rootDir, entityName);
  if (!fs.existsSync(wikiPath)) return null;
  return fs.readFileSync(wikiPath, 'utf-8');
}

function writeWikiFile(rootDir, entityName, content) {
  const wikiPath = getWikiPath(rootDir, entityName);
  fs.mkdirSync(path.dirname(wikiPath), { recursive: true });
  fs.writeFileSync(wikiPath, content, 'utf-8');
  return wikiPath;
}

module.exports = {
  DEFAULT_AUTO_BLOCKS,
  createInitialWiki,
  updateWikiContent,
  readWikiFile,
  writeWikiFile,
  getWikiPath
};
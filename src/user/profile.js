const fs = require('fs');
const path = require('path');
const { updateWikiContent } = require('../builder');

const USERS_DIR = 'users';

function getUserDir(systemDir, username) {
  return path.join(systemDir, USERS_DIR, username);
}

function ensureUserDir(systemDir, username) {
  const dir = getUserDir(systemDir, username);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function loadUserWiki(systemDir, username) {
  const wikiPath = path.join(getUserDir(systemDir, username), `${username}-wiki.md`);
  if (!fs.existsSync(wikiPath)) return null;
  return fs.readFileSync(wikiPath, 'utf-8');
}

function saveUserWiki(systemDir, username, content) {
  ensureUserDir(systemDir, username);
  const wikiPath = path.join(getUserDir(systemDir, username), `${username}-wiki.md`);
  fs.writeFileSync(wikiPath, content, 'utf-8');
  return wikiPath;
}

function loadUserState(systemDir, username) {
  const statePath = path.join(getUserDir(systemDir, username), 'state.json');
  if (!fs.existsSync(statePath)) {
    return { chatCount: 0, lastChatTime: null, preferenceVersion: 0 };
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

function saveUserState(systemDir, username, state) {
  ensureUserDir(systemDir, username);
  const statePath = path.join(getUserDir(systemDir, username), 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  return statePath;
}

function createUserWiki(username, role = 'default') {
  const now = new Date().toISOString();
  return `---
username: ${username}
role: ${role}
created_at: ${now}
updated_at: ${now}
---

# ${username} — 用户档案

<!-- MANUAL:PROFILE -->
## 基础信息
- 职位：
- 部门：
- 公司：
- 常用语言：中文
<!-- /MANUAL:PROFILE -->

<!-- AUTO:PREFERENCES -->
## 沟通偏好
（待从沟通中提取）
<!-- /AUTO:PREFERENCES -->

<!-- AUTO:CONTEXT -->
## 最近关注
（待从沟通中提取）
<!-- /AUTO:CONTEXT -->

<!-- AUTO:EXPERTISE -->
## 专业领域
（待从沟通中提取）
<!-- /AUTO:EXPERTISE -->

<!-- MANUAL:NOTES -->
> 个人备注区（自由编辑，系统不会覆盖）

<!-- /MANUAL:NOTES -->
`;
}

function updateUserWikiContent(existingWiki, autoBlocks) {
  return updateWikiContent(existingWiki, autoBlocks);
}

function extractBlock(wiki, blockName) {
  if (!wiki) return '';
  const regex = new RegExp(`<!--\\s*${blockName}\\s*-->\\n?([\\s\\S]*?)\\n?<!--\\s*\\/${blockName}\\s*-->`);
  return wiki.match(regex)?.[1]?.trim() || '';
}

function getUserContext(systemDir, username) {
  const wiki = loadUserWiki(systemDir, username);
  if (!wiki) return '';

  const prefs = extractBlock(wiki, 'AUTO:PREFERENCES');
  const ctx = extractBlock(wiki, 'AUTO:CONTEXT');
  const expertise = extractBlock(wiki, 'AUTO:EXPERTISE');
  return [prefs, ctx, expertise].filter(Boolean).join('\n');
}

module.exports = {
  USERS_DIR,
  getUserDir,
  ensureUserDir,
  loadUserWiki,
  saveUserWiki,
  loadUserState,
  saveUserState,
  createUserWiki,
  updateUserWikiContent,
  getUserContext
};
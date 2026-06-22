const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  ensureUserDir,
  createUserWiki,
  loadUserWiki,
  saveUserWiki,
  loadUserState,
  saveUserState,
  updateUserWikiContent,
  getUserContext
} = require('../../src/user/profile');

describe('user/profile', () => {
  let systemDir;

  beforeEach(() => {
    systemDir = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-user-'));
  });

  afterEach(() => {
    fs.rmSync(systemDir, { recursive: true, force: true });
  });

  test('create/save/load user wiki should persist profile file', () => {
    ensureUserDir(systemDir, '张三');
    const wiki = createUserWiki('张三', 'manager');
    saveUserWiki(systemDir, '张三', wiki);

    const loaded = loadUserWiki(systemDir, '张三');
    expect(loaded).toContain('张三 — 用户档案');
    expect(loaded).toContain('role: manager');
  });

  test('save/load user state should persist state', () => {
    saveUserState(systemDir, '张三', { chatCount: 7, preferenceVersion: 2 });
    const state = loadUserState(systemDir, '张三');

    expect(state.chatCount).toBe(7);
    expect(state.preferenceVersion).toBe(2);
  });

  test('updateUserWikiContent should only update AUTO blocks and keep MANUAL', () => {
    const wiki = `# 张三 — 用户档案\n\n<!-- MANUAL:PROFILE -->\n## 基础信息\n- 职位：采购经理\n<!-- /MANUAL:PROFILE -->\n\n<!-- AUTO:PREFERENCES -->\n旧偏好\n<!-- /AUTO:PREFERENCES -->`;

    const next = updateUserWikiContent(wiki, {
      'AUTO:PREFERENCES': '## 沟通偏好\n- 偏好表格输出',
      'AUTO:CONTEXT': '## 最近关注\n- 富士康Q3续签'
    });

    expect(next).toContain('采购经理');
    expect(next).toContain('偏好表格输出');
    expect(next).toContain('AUTO:CONTEXT');
  });

  test('getUserContext should extract preferences/context/expertise sections', () => {
    const wiki = `# 张三 — 用户档案\n\n<!-- AUTO:PREFERENCES -->\n偏好：简洁\n<!-- /AUTO:PREFERENCES -->\n\n<!-- AUTO:CONTEXT -->\n关注：合同到期\n<!-- /AUTO:CONTEXT -->\n\n<!-- AUTO:EXPERTISE -->\n采购管理\n<!-- /AUTO:EXPERTISE -->`;

    saveUserWiki(systemDir, '张三', wiki);

    const context = getUserContext(systemDir, '张三');
    expect(context).toContain('偏好：简洁');
    expect(context).toContain('关注：合同到期');
    expect(context).toContain('采购管理');
  });
});

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  loadSchema,
  saveSchema,
  addSuggestion,
  getPendingSuggestions,
  adoptSuggestion,
  ignoreSuggestion
} = require('../../src/schema/manager');

describe('schema/manager', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-schema-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('saveSchema/loadSchema should persist schema.md', () => {
    saveSchema(tempRoot, '# 客户资料提取规则\n- 收款记录');
    const schema = loadSchema(tempRoot);
    expect(schema).toContain('客户资料提取规则');
  });

  test('addSuggestion/getPendingSuggestions should collect pending items', () => {
    addSuggestion(tempRoot, {
      id: 'sug_1',
      type: 'add_event_type',
      change: '事件类型枚举追加: 退货',
      status: 'pending'
    });

    const pending = getPendingSuggestions(tempRoot);
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe('sug_1');
  });

  test('adoptSuggestion should mark adopted and append change into schema', () => {
    saveSchema(tempRoot, '# 客户资料提取规则');
    addSuggestion(tempRoot, {
      id: 'sug_2',
      type: 'add_focus',
      change: '提取规则追加: 金额必须标注是否含税',
      status: 'pending'
    });

    const adopted = adoptSuggestion(tempRoot, 'sug_2');
    const schema = loadSchema(tempRoot);

    expect(adopted.status).toBe('adopted');
    expect(schema).toContain('金额必须标注是否含税');
  });

  test('ignoreSuggestion should mark suggestion ignored', () => {
    addSuggestion(tempRoot, {
      id: 'sug_3',
      type: 'add_block',
      change: '新增 AUTO:DELIVERY 区块',
      status: 'pending'
    });

    const ignored = ignoreSuggestion(tempRoot, 'sug_3');
    expect(ignored.status).toBe('ignored');
    expect(getPendingSuggestions(tempRoot)).toHaveLength(0);
  });
});

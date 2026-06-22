const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getEntityDir,
  ensureStateDir,
  loadState,
  saveState,
  appendEventsDedup,
  saveVersionSnapshot
} = require('../../src/workspace/state');

describe('workspace/state', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-state-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('getEntityDir should point to .LangWIKI/entities/<entity>', () => {
    const entityDir = getEntityDir(tempRoot, '富士康');
    expect(entityDir).toBe(path.join(tempRoot, '.LangWIKI', 'entities', '富士康'));
  });

  test('saveState and loadState should persist json', () => {
    ensureStateDir(tempRoot, '富士康');
    saveState(tempRoot, '富士康', { version: 1, processedFiles: { '合同.pdf': 'sha256:x' } });

    const state = loadState(tempRoot, '富士康');
    expect(state.version).toBe(1);
    expect(state.processedFiles['合同.pdf']).toBe('sha256:x');
  });

  test('appendEventsDedup should append only new fingerprint events', () => {
    const firstBatch = [
      { event_fingerprint: 'fp_1', event_type: '收款', amount: 5000 },
      { event_fingerprint: 'fp_2', event_type: '合同签订', amount: 30000 }
    ];
    const secondBatch = [
      { event_fingerprint: 'fp_2', event_type: '合同签订', amount: 30000 },
      { event_fingerprint: 'fp_3', event_type: '付款', amount: 1000 }
    ];

    appendEventsDedup(tempRoot, '富士康', firstBatch);
    const appended = appendEventsDedup(tempRoot, '富士康', secondBatch);

    expect(appended).toBe(1);

    const eventsPath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', 'events.jsonl');
    const lines = fs.readFileSync(eventsPath, 'utf-8').trim().split('\n');

    expect(lines).toHaveLength(3);
  });

  test('saveVersionSnapshot should create timestamped markdown snapshot', () => {
    const snapshotPath = saveVersionSnapshot(tempRoot, '富士康', '# 富士康 wiki');

    expect(fs.existsSync(snapshotPath)).toBe(true);
    expect(snapshotPath.endsWith('.md')).toBe(true);
  });
});

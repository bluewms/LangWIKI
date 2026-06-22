const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../src/parser', () => ({
  parse: jest.fn(async () => 'mock-file-text')
}));

jest.mock('../../src/extractor', () => ({
  extractEvents: jest.fn(async () => ([
    {
      event_id: 'evt_1',
      event_type: '收款',
      party: '富士康',
      amount: 5000,
      currency: 'CNY',
      event_date: '2026-05-29',
      source_sha256: 'sha256:abc',
      event_fingerprint: 'fp_1',
      updated_at: '2026-05-29T00:00:00.000Z'
    }
  ])),
  generateWikiBlocks: jest.fn(async () => ({
    'AUTO:SUMMARY': '## 业务摘要\n- 当前状态：活跃',
    'AUTO:TIMELINE': '## 时间线\n- 2026-05-29 收款 ¥5000'
  }))
}));

jest.mock('../../src/workspace/scanner', () => {
  const actual = jest.requireActual('../../src/workspace/scanner');
  return {
    ...actual,
    scanDirectory: jest.fn(() => ({
      subdirs: [
        { name: '富士康', path: '/workspace/富士康' },
        { name: '比亚迪', path: '/workspace/比亚迪' }
      ],
      files: []
    }))
  };
});

const { PRIORITY } = require('../../src/queue');
const { Orchestrator } = require('../../src/orchestrator');
const { parse } = require('../../src/parser');
const { extractEvents } = require('../../src/extractor');
const { scanDirectory } = require('../../src/workspace/scanner');

describe('orchestrator/index', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-orch-'));
    fs.mkdirSync(path.join(tempRoot, '富士康'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, '富士康', '合同.txt'), 'hello', 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  test('schedule methods should enqueue jobs with expected priorities', () => {
    const queue = {
      on: jest.fn(),
      enqueue: jest.fn(),
      enqueueBatch: jest.fn()
    };

    const orchestrator = new Orchestrator({ chat: jest.fn() }, { queue });

    orchestrator.scheduleInitialScan('/workspace');
    orchestrator.scheduleIncrementalScan('/workspace', '富士康');
    orchestrator.scheduleManualIngest('/workspace', '富士康');

    expect(scanDirectory).toHaveBeenCalledWith('/workspace');
    expect(queue.enqueueBatch).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'ingest-entity' })
      ]),
      PRIORITY.LOW
    );

    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ priority: PRIORITY.NORMAL })
    );

    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ priority: PRIORITY.HIGH })
    );
  });

  test('ingest should parse files, extract events and write wiki artifacts', async () => {
    const orchestrator = new Orchestrator({ chat: jest.fn() });

    const result = await orchestrator.ingest(tempRoot, '富士康');

    expect(parse).toHaveBeenCalled();
    expect(extractEvents).toHaveBeenCalled();
    expect(result.processedFiles).toBe(1);

    const wikiPath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', '富士康-wiki.md');
    const statePath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', 'state.json');
    const eventsPath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', 'events.jsonl');

    expect(fs.existsSync(wikiPath)).toBe(true);
    expect(fs.existsSync(statePath)).toBe(true);
    expect(fs.existsSync(eventsPath)).toBe(true);

    const wiki = fs.readFileSync(wikiPath, 'utf-8');
    expect(wiki).toContain('当前状态：活跃');
  });
});

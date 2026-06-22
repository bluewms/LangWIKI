const fs = require('fs');
const os = require('os');
const path = require('path');

const { updateIndex } = require('../../src/wiki/index');
const { appendLog } = require('../../src/wiki/log');
const { AnythingLLMSync } = require('../../src/wiki/sync');

describe('wiki modules', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-wiki-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('updateIndex should create and include entity links', () => {
    const markdown = updateIndex(tempRoot, [
      {
        name: '富士康',
        summary: '电子制造，活跃合作中，累计¥500,000',
        wikiPath: 'entities/富士康/富士康-wiki.md'
      }
    ]);

    expect(markdown).toContain('# 客户资料知识库索引');
    expect(markdown).toContain('[富士康](entities/富士康/富士康-wiki.md)');
  });

  test('appendLog should append ingest log section', () => {
    appendLog(tempRoot, {
      action: 'ingest',
      entity: '富士康',
      lines: ['新增文件: 2 个', '提取事件: 2 条']
    });

    const logPath = path.join(tempRoot, '.LangWIKI', 'log.md');
    const content = fs.readFileSync(logPath, 'utf-8');

    expect(content).toContain('ingest | 富士康');
    expect(content).toContain('新增文件: 2 个');
  });

  test('AnythingLLMSync notifyNewWiki should call collector API in collector mode', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));

    const sync = new AnythingLLMSync({
      anythingllmUrl: 'http://localhost:3001',
      sharedVolume: '/data/business',
      mode: 'collector',
      apiKey: 'abc'
    });

    await sync.notifyNewWiki('/data/business/.LangWIKI/entities/富士康/富士康-wiki.md');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/document/upload',
      expect.objectContaining({ method: 'POST' })
    );

    global.fetch = originalFetch;
  });
});

const fs = require('fs');
const os = require('os');
const path = require('path');

const { Orchestrator } = require('../../src/orchestrator');

describe('e2e/full-ingest', () => {
  let tempRoot;
  let llmClient;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-e2e-ingest-'));
    fs.mkdirSync(path.join(tempRoot, '富士康'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, '富士康', '合同.txt'), '2026-05-28 收款 5000', 'utf-8');

    llmClient = {
      chat: jest.fn(async (prompt) => {
        if (String(prompt).includes('JSON 数组格式输出')) {
          return JSON.stringify([
            {
              event_type: '收款',
              party: '富士康',
              amount: 5000,
              currency: 'CNY',
              event_date: '2026-05-28',
              description: '合同收款'
            }
          ]);
        }

        return `<!-- AUTO:SUMMARY -->\n## 业务摘要\n- 当前状态：活跃\n<!-- /AUTO:SUMMARY -->\n<!-- AUTO:TIMELINE -->\n## 时间线\n- 2026-05-28 收款 ¥5000\n<!-- /AUTO:TIMELINE -->`;
      })
    };
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('should generate wiki artifacts on first ingest and update on incremental ingest', async () => {
    const orchestrator = new Orchestrator(llmClient);

    const first = await orchestrator.ingest(tempRoot, '富士康', { force: true });
    expect(first.processedFiles).toBe(1);
    expect(first.newEvents).toBe(1);

    const wikiPath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', '富士康-wiki.md');
    const statePath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', 'state.json');
    const eventsPath = path.join(tempRoot, '.LangWIKI', 'entities', '富士康', 'events.jsonl');

    expect(fs.existsSync(wikiPath)).toBe(true);
    expect(fs.existsSync(statePath)).toBe(true);
    expect(fs.existsSync(eventsPath)).toBe(true);

    const firstWiki = fs.readFileSync(wikiPath, 'utf-8');
    expect(firstWiki).toContain('当前状态：活跃');

    fs.writeFileSync(path.join(tempRoot, '富士康', '新增记录.txt'), '2026-05-29 收款 800', 'utf-8');
    const second = await orchestrator.ingest(tempRoot, '富士康');

    expect(second.processedFiles).toBe(1);

    const eventsLines = fs.readFileSync(eventsPath, 'utf-8').trim().split('\n');
    expect(eventsLines.length).toBeGreaterThanOrEqual(2);
  });
});

const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const { createServer } = require('../../src/server');

describe('routes/query', () => {
  let tempRoot;
  let app;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-query-'));

    const entityDir = path.join(tempRoot, '.LangWIKI', 'entities', '富士康');
    fs.mkdirSync(entityDir, { recursive: true });
    fs.writeFileSync(
      path.join(entityDir, '富士康-wiki.md'),
      '# 富士康业务档案\n\n## 业务摘要\n- 合同金额 5000\n- 当前状态：活跃\n',
      'utf-8'
    );

    fs.writeFileSync(path.join(tempRoot, '.LangWIKI', 'index.md'), '# 索引\n- 富士康', 'utf-8');
    fs.writeFileSync(path.join(tempRoot, '.LangWIKI', 'log.md'), '## [2026-05-29] ingest | 富士康', 'utf-8');

    const llmClient = {
      chat: jest.fn(async () => ({ textResponse: '基于证据：富士康合同金额5000。' }))
    };

    app = createServer({
      langwiki: {
        defaultRootDir: tempRoot,
        llmClient,
        orchestrator: {
          scheduleManualIngest: jest.fn(),
          scheduleInitialScan: jest.fn(),
          queue: { getStatus: jest.fn(() => ({ state: 'idle', pending: 0, running: 0, completed: 0 })), pause: jest.fn(), resume: jest.fn() }
        }
      },
      dataDir: tempRoot
    });
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('GET /api/langwiki/query should return matched wiki evidence', async () => {
    const res = await request(app)
      .get('/api/langwiki/query')
      .query({ q: '合同金额' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0].snippet).toContain('合同金额');
  });

  test('POST /api/langwiki/ask should return answer with evidence', async () => {
    const res = await request(app)
      .post('/api/langwiki/ask')
      .send({ question: '富士康合同金额是多少？' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.answer).toContain('富士康');
    expect(res.body.evidence.length).toBeGreaterThan(0);
  });
});

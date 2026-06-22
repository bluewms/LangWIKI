const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const { createUserRouter } = require('../../src/user/routes');

describe('e2e/user-profile', () => {
  let systemDir;
  let app;

  beforeEach(() => {
    systemDir = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-e2e-user-'));

    const llmClient = {
      chat: jest.fn(async () => `<!-- AUTO:PREFERENCES -->\n偏好：表格优先\n<!-- /AUTO:PREFERENCES -->\n<!-- AUTO:CONTEXT -->\n关注：合同到期\n<!-- /AUTO:CONTEXT -->\n<!-- AUTO:EXPERTISE -->\n采购管理\n<!-- /AUTO:EXPERTISE -->`)
    };

    app = express();
    app.use(express.json());
    app.use('/api/langwiki', createUserRouter({ systemDir, llmClient }));
  });

  afterEach(() => {
    fs.rmSync(systemDir, { recursive: true, force: true });
  });

  test('should extract user preferences and expose context for prompt injection', async () => {
    const extractRes = await request(app)
      .post('/api/langwiki/users/张三/extract')
      .send({ chatHistory: '请给我表格，关注合同到期。' });

    expect(extractRes.status).toBe(200);
    expect(extractRes.body.updatedBlocks).toEqual(
      expect.arrayContaining(['AUTO:PREFERENCES', 'AUTO:CONTEXT', 'AUTO:EXPERTISE'])
    );

    const contextRes = await request(app).get('/api/langwiki/users/张三/context');
    expect(contextRes.status).toBe(200);
    expect(contextRes.body.context).toContain('表格优先');
    expect(contextRes.body.context).toContain('合同到期');
  });
});

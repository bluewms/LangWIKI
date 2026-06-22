const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const { createServer } = require('../../src/server');
const { saveSchema } = require('../../src/schema/manager');

describe('routes/langwiki', () => {
  let tempRoot;
  let systemDir;
  let app;
  let orchestrator;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-workspace-'));
    systemDir = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-system-'));

    orchestrator = {
      scheduleManualIngest: jest.fn(() => 'job_high_1'),
      scheduleInitialScan: jest.fn(() => ['job_low_1']),
      scheduleIncrementalScan: jest.fn(() => 'job_normal_1'),
      ingest: jest.fn(async () => ({ entityName: '富士康', processedFiles: 1 })),
      queue: {
        getStatus: jest.fn(() => ({ state: 'running', pending: 1, running: 1, completed: 2 })),
        pause: jest.fn(),
        resume: jest.fn()
      }
    };

    app = createServer({
      corsOrigin: '*',
      dataDir: tempRoot,
      usersDir: path.join(systemDir, 'users'),
      langwiki: {
        defaultRootDir: tempRoot,
        orchestrator,
        systemDir
      }
    });
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.rmSync(systemDir, { recursive: true, force: true });
  });

  test('GET / should return service home', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('LangWIKI');
    expect(res.text).toContain('/api/langwiki/health');
  });

  test('POST /api/langwiki/ingest/trigger should support source and output directories', async () => {
    const outputRootDir = path.join(tempRoot, 'workspaces', 'ws-001');
    const res = await request(app)
      .post('/api/langwiki/ingest/trigger')
      .send({ rootDir: tempRoot, outputRootDir, entityName: '富士康' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(orchestrator.scheduleManualIngest).toHaveBeenCalledWith(tempRoot, '富士康', { outputRootDir });
  });

  test('GET /api/langwiki/ingest/status should return queue status', async () => {
    const res = await request(app).get('/api/langwiki/ingest/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toEqual({ state: 'running', pending: 1, running: 1, completed: 2 });
  });

  test('workspaces API should auto create id and rootDir when omitted', async () => {
    const createRes = await request(app)
      .post('/api/langwiki/workspaces')
      .send({ name: '新建工作1' });

    expect(createRes.status).toBe(200);
    expect(createRes.body.ok).toBe(true);
    expect(createRes.body.workspace.id).toMatch(/^ws-/);
    expect(createRes.body.workspace.name).toBe('新建工作1');
    expect(createRes.body.workspace.rootDir).toContain('/workspaces/');

    const listRes = await request(app).get('/api/langwiki/workspaces');
    expect(listRes.status).toBe(200);
    expect(listRes.body.workspaces).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createRes.body.workspace.id, name: '新建工作1' })])
    );
  });

  test('workspace tree API should return directories and md documents', async () => {
    fs.mkdirSync(path.join(tempRoot, '合同', '2026'), { recursive: true });
    fs.writeFileSync(path.join(tempRoot, '合同', '2026', '富士康-wiki.md'), '# 富士康\n\n测试内容', 'utf-8');

    await request(app)
      .post('/api/langwiki/workspaces')
      .send({ id: '客户资料', rootDir: tempRoot, name: '客户资料' });

    const treeRes = await request(app).get('/api/langwiki/workspaces/客户资料/tree');
    expect(treeRes.status).toBe(200);
    expect(treeRes.body.ok).toBe(true);
    expect(treeRes.body.tree).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'dir', name: '合同' })
    ]));

    const docRes = await request(app)
      .get('/api/langwiki/workspaces/客户资料/document')
      .query({ path: '合同/2026/富士康-wiki.md' });

    expect(docRes.status).toBe(200);
    expect(docRes.body.ok).toBe(true);
    expect(docRes.body.content).toContain('富士康');
  });

  test('workspace settings API should update name, sourceDir and git settings', async () => {
    const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-source-'));
    const createRes = await request(app)
      .post('/api/langwiki/workspaces')
      .send({ name: '新建工作1' });

    const id = createRes.body.workspace.id;
    const patchRes = await request(app)
      .patch(`/api/langwiki/workspaces/${encodeURIComponent(id)}`)
      .send({
        name: '客户资料库',
        sourceDir,
        git: { enabled: true, remoteUrl: 'git@github.com:demo/langwiki-md.git', branch: 'main' }
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.workspace.name).toBe('客户资料库');
    expect(patchRes.body.workspace.sourceDir).toBe(sourceDir);
    expect(patchRes.body.workspace.git.enabled).toBe(true);

    const fsRes = await request(app)
      .get('/api/langwiki/filesystem/dirs')
      .query({ path: sourceDir });

    expect(fsRes.status).toBe(200);
    expect(fsRes.body.ok).toBe(true);
    expect(fsRes.body.current).toBe(sourceDir);
  });

  test('delete workspace API should remove workspace and its knowledge files', async () => {
    const createRes = await request(app)
      .post('/api/langwiki/workspaces')
      .send({ name: '待删除工作区' });

    const workspace = createRes.body.workspace;
    const wikiDir = path.join(workspace.rootDir, '.LangWIKI', 'entities', '客户A');
    fs.mkdirSync(wikiDir, { recursive: true });
    fs.writeFileSync(path.join(wikiDir, '客户A-wiki.md'), '# 客户A', 'utf-8');

    const deleteRes = await request(app)
      .delete(`/api/langwiki/workspaces/${encodeURIComponent(workspace.id)}`)
      .query({ deleteFiles: 'true' });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ok).toBe(true);
    expect(deleteRes.body.deletedWorkspace.id).toBe(workspace.id);
    expect(fs.existsSync(path.join(workspace.rootDir, '.LangWIKI'))).toBe(false);

    const listRes = await request(app).get('/api/langwiki/workspaces');
    expect(listRes.body.workspaces.some((item) => item.id === workspace.id)).toBe(false);
  });

  test('schema API should read saved schema', async () => {
    saveSchema(tempRoot, '# 客户资料提取规则\n- 收款记录');

    const res = await request(app)
      .get('/api/langwiki/schema')
      .query({ rootDir: tempRoot });

    expect(res.status).toBe(200);
    expect(res.body.schema).toContain('客户资料提取规则');
  });

  test('user API should return context', async () => {
    await request(app)
      .put('/api/langwiki/users/张三/profile')
      .send({
        autoBlocks: {
          'AUTO:PREFERENCES': '偏好：简洁',
          'AUTO:CONTEXT': '关注：合同到期',
          'AUTO:EXPERTISE': '采购管理'
        }
      });

    const res = await request(app).get('/api/langwiki/users/张三/context');

    expect(res.status).toBe(200);
    expect(res.body.context).toContain('偏好：简洁');
    expect(res.body.context).toContain('采购管理');
  });
});

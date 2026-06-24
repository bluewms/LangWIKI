const express = require('express');
const { FILE_TYPE_EXTENSIONS, FILE_TYPE_LABELS } = require('../workspace/scanner');

function createOrchestrateRouter(config = {}) {
  const router = express.Router();
  const orchestrator = config.orchestrator;
  const defaultRootDir = config.defaultRootDir;

  // 获取支持的文件类型分组
  router.get('/ingest/file-types', (_req, res) => {
    const types = Object.entries(FILE_TYPE_EXTENSIONS).map(([key, exts]) => ({
      key,
      label: FILE_TYPE_LABELS[key] || key,
      extensions: exts
    }));
    return res.json({ ok: true, types });
  });

  router.post('/ingest/trigger', (req, res) => {
    const rootDir = req.body?.rootDir || defaultRootDir;
    const outputRootDir = req.body?.outputRootDir || rootDir;
    const entityName = req.body?.entityName;

    if (!entityName) {
      return res.status(400).json({ ok: false, error: 'entityName is required' });
    }

    const jobId = orchestrator.scheduleManualIngest(rootDir, entityName, { outputRootDir });
    return res.json({ ok: true, jobId, priority: 'HIGH' });
  });

  router.post('/ingest/initial', (req, res) => {
    const rootDir = req.body?.rootDir || defaultRootDir;
    const outputRootDir = req.body?.outputRootDir || rootDir;
    const fileTypes = req.body?.fileTypes || null;
    const jobIds = orchestrator.scheduleInitialScan(rootDir, { outputRootDir, fileTypes });
    return res.json({ ok: true, jobIds, priority: 'LOW' });
  });

  router.get('/ingest/status', (_req, res) => {
    const status = orchestrator.queue.getStatus();
    return res.json({ ok: true, status });
  });

  router.post('/ingest/pause', (_req, res) => {
    orchestrator.queue.pause();
    return res.json({ ok: true });
  });

  router.post('/ingest/resume', (_req, res) => {
    orchestrator.queue.resume();
    return res.json({ ok: true });
  });

  return router;
}

module.exports = {
  createOrchestrateRouter
};
const express = require('express');
const {
  loadSchema,
  saveSchema,
  getPendingSuggestions,
  adoptSuggestion,
  ignoreSuggestion
} = require('./manager');

function createSchemaRouter(config = {}) {
  const router = express.Router();

  router.get('/schema', (req, res) => {
    const rootDir = req.query.rootDir || config.rootDir;
    res.json({ ok: true, schema: loadSchema(rootDir) });
  });

  router.put('/schema', (req, res) => {
    const rootDir = req.query.rootDir || config.rootDir;
    const { content = '' } = req.body || {};
    saveSchema(rootDir, content);
    res.json({ ok: true });
  });

  router.get('/schema/suggestions', (req, res) => {
    const rootDir = req.query.rootDir || config.rootDir;
    res.json({ ok: true, suggestions: getPendingSuggestions(rootDir) });
  });

  router.post('/schema/suggestions/:id/adopt', (req, res) => {
    const rootDir = req.query.rootDir || config.rootDir;
    const suggestion = adoptSuggestion(rootDir, req.params.id);
    res.json({ ok: true, suggestion });
  });

  router.post('/schema/suggestions/:id/ignore', (req, res) => {
    const rootDir = req.query.rootDir || config.rootDir;
    const suggestion = ignoreSuggestion(rootDir, req.params.id);
    res.json({ ok: true, suggestion });
  });

  return router;
}

module.exports = {
  createSchemaRouter
};
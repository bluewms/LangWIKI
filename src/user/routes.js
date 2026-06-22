const express = require('express');
const {
  loadUserWiki,
  saveUserWiki,
  createUserWiki,
  updateUserWikiContent,
  getUserContext
} = require('./profile');
const { extractUserPreferences } = require('./extractor');

function createUserRouter(config = {}) {
  const router = express.Router();
  const systemDir = config.systemDir;
  const llmClient = config.llmClient;

  router.get('/users/:username/wiki', (req, res) => {
    const { username } = req.params;
    let wiki = loadUserWiki(systemDir, username);
    if (!wiki) {
      wiki = createUserWiki(username, 'default');
      saveUserWiki(systemDir, username, wiki);
    }
    res.json({ ok: true, wiki });
  });

  router.put('/users/:username/profile', (req, res) => {
    const { username } = req.params;
    const { autoBlocks = {} } = req.body || {};

    const existing = loadUserWiki(systemDir, username) || createUserWiki(username, 'default');
    const next = updateUserWikiContent(existing, autoBlocks);
    saveUserWiki(systemDir, username, next);

    res.json({ ok: true });
  });

  router.get('/users/:username/context', (req, res) => {
    const { username } = req.params;
    const context = getUserContext(systemDir, username);
    res.json({ ok: true, context });
  });

  router.post('/users/:username/extract', async (req, res) => {
    const { username } = req.params;
    const { chatHistory = '', schemaContent = '' } = req.body || {};
    const existing = loadUserWiki(systemDir, username) || createUserWiki(username, 'default');

    const blocks = await extractUserPreferences(llmClient, chatHistory, existing, schemaContent);
    const next = updateUserWikiContent(existing, blocks);
    saveUserWiki(systemDir, username, next);

    res.json({ ok: true, updatedBlocks: Object.keys(blocks) });
  });

  return router;
}

module.exports = {
  createUserRouter
};
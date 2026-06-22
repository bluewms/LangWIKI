const fs = require('fs');
const path = require('path');
const express = require('express');
const { readWikiFile, writeWikiFile, updateWikiContent } = require('../builder');
const { searchWiki } = require('../search');

function createKnowledgeRouter(config = {}) {
  const router = express.Router();
  const defaultRootDir = config.defaultRootDir;
  const llmClient = config.llmClient;

  router.get('/entities', (req, res) => {
    const rootDir = req.query.rootDir || defaultRootDir;
    const entitiesDir = path.join(rootDir, '.LangWIKI', 'entities');

    if (!fs.existsSync(entitiesDir)) {
      return res.json({ ok: true, entities: [] });
    }

    const entities = fs
      .readdirSync(entitiesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ name: entry.name }));

    return res.json({ ok: true, entities });
  });

  router.get('/entities/:name/wiki', (req, res) => {
    const rootDir = req.query.rootDir || defaultRootDir;
    const wiki = readWikiFile(rootDir, req.params.name);

    if (!wiki) {
      return res.status(404).json({ ok: false, error: 'Wiki not found' });
    }

    return res.json({ ok: true, wiki });
  });

  router.put('/entities/:name/wiki', (req, res) => {
    const rootDir = req.query.rootDir || defaultRootDir;
    const entityName = req.params.name;
    const autoBlocks = req.body?.autoBlocks || {};

    const current = readWikiFile(rootDir, entityName);
    if (!current) {
      return res.status(404).json({ ok: false, error: 'Wiki not found' });
    }

    const next = updateWikiContent(current, autoBlocks);
    writeWikiFile(rootDir, entityName, next);
    return res.json({ ok: true });
  });

  router.get('/query', (req, res) => {
    const rootDir = req.query.rootDir || defaultRootDir;
    const q = req.query.q || '';
    const entityName = req.query.entityName || null;

    const results = searchWiki(rootDir, q, { entityName, limit: 10 });
    return res.json({ ok: true, results });
  });

  router.post('/ask', async (req, res) => {
    const rootDir = req.body?.rootDir || defaultRootDir;
    const question = String(req.body?.question || '').trim();

    if (!question) {
      return res.status(400).json({ ok: false, error: 'question is required' });
    }

    let evidence = searchWiki(rootDir, question, { limit: 5 });

    if (evidence.length === 0) {
      const candidates = question
        .split(/[\s，。！？、,.?？!]/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
        .sort((a, b) => b.length - a.length);

      for (const token of candidates) {
        evidence = searchWiki(rootDir, token, { limit: 5 });
        if (evidence.length > 0) break;

        const denseToken = token.replace(/[是多少多少请问吗呢]/g, '');
        if (denseToken.length >= 2) {
          for (let len = Math.min(6, denseToken.length); len >= 2 && evidence.length === 0; len -= 1) {
            for (let i = 0; i <= denseToken.length - len; i += 1) {
              const chunk = denseToken.slice(i, i + len);
              evidence = searchWiki(rootDir, chunk, { limit: 5 });
              if (evidence.length > 0) break;
            }
          }
        }

        if (evidence.length > 0) break;
      }
    }

    if (!llmClient || typeof llmClient.chat !== 'function') {
      return res.json({ ok: true, answer: '未配置 LLM 客户端，已返回证据。', evidence });
    }

    const prompt = `你是 LangWIKI 助手。请仅基于以下证据回答问题。\n\n问题：${question}\n\n证据：\n${evidence
      .map((item, i) => `[${i + 1}] ${item.file}\n${item.snippet}`)
      .join('\n\n')}\n\n要求：如果证据不足，明确说“证据不足”。`;

    try {
      const response = await llmClient.chat(prompt);
      const answer = typeof response === 'string'
        ? response
        : response?.textResponse || response?.content || response?.message || '';

      return res.json({ ok: true, answer, evidence });
    } catch (_error) {
      return res.json({
        ok: true,
        answer: 'LLM 暂不可用，已返回证据供人工确认。',
        evidence
      });
    }
  });

  return router;
}

module.exports = {
  createKnowledgeRouter
};
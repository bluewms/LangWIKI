const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { createLangwikiRouter } = require('./routes');
const { LlmClient } = require('./llm/client');
const { Orchestrator } = require('./orchestrator');

function createServer(config = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin || '*' }));
  app.use(express.json({ limit: '2mb' }));

  const langwikiConfig = config.langwiki || {};
  const defaultRootDir = langwikiConfig.defaultRootDir || config.dataDir || process.cwd();
  const systemDir = langwikiConfig.systemDir || config.dataDir || path.join(process.cwd(), 'data');

  const llmClient = langwikiConfig.llmClient || new LlmClient({
    anythingllmUrl: config.anythingllmUrl,
    apiKey: config.anythingllmApiKey,
    directMode: langwikiConfig.directMode,
    directConfig: langwikiConfig.directConfig
  });

  const orchestrator = langwikiConfig.orchestrator || new Orchestrator(llmClient, {
    kbRoot: defaultRootDir,
    rateControl: langwikiConfig.rateControl || {}
  });

  const frontendDist = config.frontendDist || '';
  const frontendIndex = frontendDist ? path.join(frontendDist, 'index.html') : '';
  const hasFrontend = Boolean(frontendIndex && fs.existsSync(frontendIndex));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'langwiki', ts: new Date().toISOString() });
  });

  app.get('/api/langwiki/health', (_req, res) => {
    res.json({ ok: true, mode: 'bootstrap' });
  });

  if (hasFrontend) {
    app.use(express.static(frontendDist));

    app.get('/', (_req, res) => {
      res.sendFile(frontendIndex);
    });

    app.get('/langwiki/*', (_req, res) => {
      res.sendFile(frontendIndex);
    });
  } else {
    app.get('/', (_req, res) => {
      res
        .status(200)
        .type('html')
        .send(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LangWIKI</title>
  </head>
  <body>
    <h1>LangWIKI 服务运行中</h1>
    <p>健康检查：<a href="/health">/health</a></p>
    <p>API 健康检查：<a href="/api/langwiki/health">/api/langwiki/health</a></p>
  </body>
</html>`);
    });
  }

  app.use('/api/langwiki', createLangwikiRouter({
    orchestrator,
    defaultRootDir,
    dataDir: config.dataDir || defaultRootDir,
    systemDir,
    llmClient
  }));

  app.use((err, _req, res, _next) => {
    res.status(500).json({ ok: false, error: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = { createServer };
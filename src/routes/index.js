const express = require('express');
const { createOrchestrateRouter } = require('./orchestrate');
const { createKnowledgeRouter } = require('./knowledge');
const { createWorkspaceRouter } = require('./workspace');
const { createSchemaRouter } = require('./schema');
const { createUserRouter } = require('./user');

function createLangwikiRouter(config = {}) {
  const router = express.Router();

  router.use(createOrchestrateRouter(config));
  router.use(createKnowledgeRouter(config));
  router.use(createWorkspaceRouter(config));
  router.use(createSchemaRouter({ rootDir: config.defaultRootDir }));
  router.use(createUserRouter({ systemDir: config.systemDir, llmClient: config.llmClient }));

  return router;
}

module.exports = {
  createLangwikiRouter
};
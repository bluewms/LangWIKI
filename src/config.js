const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadConfig() {
  const cwd = process.cwd();
  const dataDir = process.env.LANGWIKI_DATA_DIR || path.join(cwd, 'data');

  return {
    port: toNumber(process.env.PORT, 3100),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    anythingllmUrl: process.env.ANYTHINGLLM_URL || 'http://localhost:3001',
    anythingllmApiKey: process.env.ANYTHINGLLM_API_KEY || '',
    dataDir,
    usersDir: process.env.LANGWIKI_USERS_DIR || path.join(dataDir, 'users'),
    frontendDist: process.env.LANGWIKI_FRONTEND_DIST || ''
  };
}

module.exports = { loadConfig };
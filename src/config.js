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
    dataDir,
    usersDir: process.env.LANGWIKI_USERS_DIR || path.join(dataDir, 'users'),
    frontendDist: process.env.LANGWIKI_FRONTEND_DIST || '',

    // LLM 配置
    llm: {
      model: process.env.LLM_MODEL || 'deepseek/deepseek-chat',
      temperature: toNumber(process.env.LLM_TEMPERATURE, 0.3)
    }
  };
}

module.exports = { loadConfig };

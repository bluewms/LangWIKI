/**
 * LLM 配置持久化 — 存储到 data/llm-config.json
 *
 * 配置结构:
 * {
 *   "model": "deepseek/deepseek-chat",
 *   "temperature": 0.3,
 *   "apiKeys": {
 *     "DEEPSEEK_API_KEY": "sk-xxx",
 *     "OPENAI_API_KEY": "",
 *     ...
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = 'llm-config.json';

const ALL_ENV_KEYS = [
  'DEEPSEEK_API_KEY',
  'OPENAI_API_KEY',
  'DASHSCOPE_API_KEY',
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'LANGAI_API_KEY'
];

function getConfigPath(dataDir) {
  return path.join(dataDir, CONFIG_FILENAME);
}

function loadConfig(dataDir) {
  const filePath = getConfigPath(dataDir);
  if (!fs.existsSync(filePath)) {
    return {
      model: process.env.LLM_MODEL || 'deepseek/deepseek-chat',
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
      apiKeys: {}
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return {
      model: data.model || process.env.LLM_MODEL || 'deepseek/deepseek-chat',
      temperature: data.temperature ?? 0.3,
      apiKeys: data.apiKeys || {}
    };
  } catch {
    return {
      model: process.env.LLM_MODEL || 'deepseek/deepseek-chat',
      temperature: 0.3,
      apiKeys: {}
    };
  }
}

function saveConfig(dataDir, config) {
  const filePath = getConfigPath(dataDir);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 将配置中的 API Keys 写入 process.env，使 router.js 能读取到
 */
function applyEnvVars(config) {
  const apiKeys = config.apiKeys || {};
  for (const key of ALL_ENV_KEYS) {
    if (apiKeys[key]) {
      process.env[key] = apiKeys[key];
    }
  }
  if (config.model) {
    process.env.LLM_MODEL = config.model;
  }
  if (config.temperature !== undefined) {
    process.env.LLM_TEMPERATURE = String(config.temperature);
  }
}

/**
 * 初始化：加载配置文件并应用到环境变量
 */
function init(dataDir) {
  const config = loadConfig(dataDir);
  applyEnvVars(config);
  return config;
}

/**
 * 屏蔽 API Key（只显示前4位和后4位）
 */
function maskApiKey(key) {
  if (!key) return '';
  if (key.length <= 12) return '****';
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

/**
 * 获取配置的公开视图（屏蔽 API Key）
 */
function getPublicConfig(config) {
  const maskedKeys = {};
  const apiKeys = config.apiKeys || {};

  // 合并所有已知 key 和已存储的 key
  const allKeys = [...new Set([...ALL_ENV_KEYS, ...Object.keys(apiKeys)])];
  for (const key of allKeys) {
    const value = apiKeys[key] || process.env[key] || '';
    maskedKeys[key] = {
      configured: Boolean(value),
      masked: maskApiKey(value)
    };
  }

  return {
    model: config.model,
    temperature: config.temperature,
    apiKeys: maskedKeys
  };
}

module.exports = {
  ALL_ENV_KEYS,
  loadConfig,
  saveConfig,
  applyEnvVars,
  init,
  getPublicConfig,
  maskApiKey
};

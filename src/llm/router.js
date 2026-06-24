/**
 * LLM 多模型路由器 — 对标 knowledge-catalog/okf 的 llm_support.py
 *
 * 支持 6 类 provider：
 *   - openai:     OpenAI GPT 系列 (gpt-4o, gpt-4o-mini)
 *   - deepseek:   DeepSeek (deepseek-chat, deepseek-reasoner)
 *   - qwen:       通义千问 (OpenAI 兼容接口)
 *   - ollama:     Ollama 本地模型 (qwen2.5, llama3.2 等)
 *   - anthropic:  Claude (claude-sonnet-4, claude-3.5-haiku)
 *   - google:     Gemini (gemini-flash-latest, gemini-2.0-flash)
 *
 * 使用方式:
 *   const { resolveModel, chat } = require('./llm/router');
 *   const cfg = resolveModel('deepseek/deepseek-chat');
 *   const { textResponse } = await chat('你好', {}, cfg);
 */

const openaiCompat = require('./providers/openai_compat');
const anthropic = require('./providers/anthropic');
const gemini = require('./providers/gemini');

// ============================================================
// 模型预设 — 对标 llm_support.py 的 MODEL_PRESETS
// ============================================================

const MODEL_PRESETS = {
  // --- Google Gemini ---
  'gemini-flash-latest': {
    provider: 'google',
    model: 'gemini-flash-latest',
    envVars: ['GEMINI_API_KEY'],
    note: 'Google Gemini，默认模型'
  },
  'gemini-2.0-flash': {
    provider: 'google',
    model: 'gemini-2.0-flash',
    envVars: ['GEMINI_API_KEY'],
    note: 'Google Gemini 2.0 Flash'
  },

  // --- Anthropic Claude ---
  'claude-sonnet-4': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    envVars: ['ANTHROPIC_API_KEY'],
    note: 'Anthropic Claude Sonnet 4'
  },
  'claude-3.5-haiku': {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    envVars: ['ANTHROPIC_API_KEY'],
    note: 'Anthropic Claude 3.5 Haiku（快）'
  },

  // --- OpenAI ---
  'openai/gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    envVars: ['OPENAI_API_KEY'],
    note: 'OpenAI GPT-4o'
  },
  'openai/gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    envVars: ['OPENAI_API_KEY'],
    note: 'OpenAI GPT-4o-mini（便宜）'
  },

  // --- DeepSeek（国内可用，性价比高）---
  'deepseek/deepseek-chat': {
    provider: 'deepseek',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    envVars: ['DEEPSEEK_API_KEY'],
    note: 'DeepSeek Chat（国内可用，性价比高）'
  },
  'deepseek/deepseek-reasoner': {
    provider: 'deepseek',
    model: 'deepseek-reasoner',
    baseUrl: 'https://api.deepseek.com/v1',
    envVars: ['DEEPSEEK_API_KEY'],
    note: 'DeepSeek R1 推理模型'
  },

  // --- 通义千问（OpenAI 兼容接口）---
  'qwen/qwen-plus': {
    provider: 'qwen',
    model: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    envVars: ['DASHSCOPE_API_KEY'],
    note: '通义千问 Qwen Plus'
  },
  'qwen/qwen-turbo': {
    provider: 'qwen',
    model: 'qwen-turbo',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    envVars: ['DASHSCOPE_API_KEY'],
    note: '通义千问 Qwen Turbo（快）'
  },

  // --- LangAI vLLM 自部署模型（OpenAI 兼容接口）---
  'langai/Qwen3.6-35B-A3B-NVFP4': {
    provider: 'langai',
    model: 'nvidia/Qwen3.6-35B-A3B-NVFP4',
    baseUrl: 'http://111.231.100.113:3000/v1',
    envVars: ['LANGAI_API_KEY'],
    note: 'LangAI vLLM Qwen3.6 35B NVFP4（自部署，支持多模态/推理/工具调用）'
  },

  // --- Ollama 本地模型（完全离线）---
  'ollama/qwen2.5:7b': {
    provider: 'ollama',
    model: 'qwen2.5:7b',
    baseUrl: 'http://localhost:11434/v1',
    envVars: [],
    apiKey: 'ollama',
    note: 'Ollama 本地 Qwen2.5 7B（离线，无需 API Key）'
  },
  'ollama/llama3.2': {
    provider: 'ollama',
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434/v1',
    envVars: [],
    apiKey: 'ollama',
    note: 'Ollama 本地 Llama 3.2（离线）'
  }
};

// provider → 处理函数映射
const PROVIDER_HANDLERS = {
  openai: openaiCompat,
  deepseek: openaiCompat,
  qwen: openaiCompat,
  ollama: openaiCompat,
  langai: openaiCompat,
  anthropic,
  google: gemini
};

// provider → API Key 环境变量名映射
const PROVIDER_ENV_KEYS = {
  openai: 'OPENAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'DASHSCOPE_API_KEY',
  ollama: null,
  langai: 'LANGAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GEMINI_API_KEY'
};

/**
 * 解析模型名称，返回完整配置
 * 支持预设名 (如 "deepseek/deepseek-chat") 或自定义格式 (如 "openai/my-model@custom-base")
 */
function resolveModel(modelName) {
  const preset = MODEL_PRESETS[modelName];
  if (preset) {
    const provider = preset.provider;
    const envKey = PROVIDER_ENV_KEYS[provider];
    const apiKey = preset.apiKey || (envKey ? process.env[envKey] : '') || '';
    return {
      provider,
      model: preset.model,
      baseUrl: preset.baseUrl || null,
      apiKey,
      envVars: preset.envVars
    };
  }

  // 自定义格式: "provider/model-name"
  const slashIdx = modelName.indexOf('/');
  if (slashIdx === -1) {
    throw new Error(
      `未知模型: ${modelName}。\n` +
      `支持的格式: 预设名 (如 "deepseek/deepseek-chat") 或 "provider/model"\n` +
      `可用预设: ${Object.keys(MODEL_PRESETS).join(', ')}`
    );
  }

  const provider = modelName.slice(0, slashIdx);
  const model = modelName.slice(slashIdx + 1);
  const envKey = PROVIDER_ENV_KEYS[provider];

  if (!envKey && provider !== 'ollama') {
    throw new Error(`未知 provider: ${provider}。支持: openai, deepseek, qwen, ollama, langai, anthropic, google`);
  }

  // 默认 baseUrl
  const DEFAULT_BASES = {
    openai: 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    ollama: 'http://localhost:11434/v1',
    langai: 'http://111.231.100.113:3000/v1'
  };

  return {
    provider,
    model,
    baseUrl: DEFAULT_BASES[provider] || null,
    apiKey: provider === 'ollama' ? 'ollama' : (envKey ? process.env[envKey] : ''),
    envVars: envKey ? [envKey] : []
  };
}

/**
 * 统一 chat 入口 — 根据 provider 路由到对应实现
 */
async function chat(prompt, options = {}, config = {}) {
  const resolved = config.provider ? config : resolveModel(config.model || process.env.LLM_MODEL || 'deepseek/deepseek-chat');

  if (!resolved.apiKey && resolved.provider !== 'ollama') {
    const envKey = PROVIDER_ENV_KEYS[resolved.provider];
    throw new Error(
      `${resolved.provider} 需要 API Key。请设置环境变量 ${envKey}。\n` +
      `示例: export ${envKey}=sk-xxxx`
    );
  }

  const handler = PROVIDER_HANDLERS[resolved.provider];
  if (!handler) {
    throw new Error(`不支持的 provider: ${resolved.provider}`);
  }

  return handler.chat({
    baseUrl: resolved.baseUrl,
    apiKey: resolved.apiKey,
    model: resolved.model,
    prompt,
    options
  });
}

/**
 * 检查模型所需环境变量
 */
function checkModelEnv(modelName) {
  try {
    const resolved = resolveModel(modelName);
    return resolved.envVars.filter((v) => !process.env[v]);
  } catch {
    return [];
  }
}

/**
 * 列出所有预设模型
 */
function listSupportedModels() {
  const lines = ['支持的 LLM 模型预设：', ''];
  let currentProvider = '';
  for (const [name, preset] of Object.entries(MODEL_PRESETS)) {
    if (preset.provider !== currentProvider) {
      currentProvider = preset.provider;
      lines.push(`  [${currentProvider}]`);
    }
    const env = preset.envVars.length ? preset.envVars.join(', ') : '无需';
    lines.push(`    ${name.padEnd(32)} ${preset.note}`);
  }
  lines.push('');
  lines.push('使用: 设置环境变量 LLM_MODEL=<模型名> 或在配置中指定');
  lines.push('提示: 也支持自定义格式 provider/model-name');
  return lines.join('\n');
}

module.exports = {
  MODEL_PRESETS,
  resolveModel,
  chat,
  checkModelEnv,
  listSupportedModels
};

const express = require('express');
const { LlmClient, listSupportedModels } = require('../llm/client');
const { resolveModel, MODEL_PRESETS } = require('../llm/router');
const { loadConfig, saveConfig, applyEnvVars, getPublicConfig } = require('../llm/config-store');

function createLlmRouter(config = {}) {
  const router = express.Router();
  const dataDir = config.dataDir;
  let llmClient = config.llmClient;

  // 获取支持的模型列表
  router.get('/llm/models', (_req, res) => {
    const models = Object.entries(MODEL_PRESETS).map(([name, preset]) => ({
      name,
      provider: preset.provider,
      note: preset.note,
      envVars: preset.envVars
    }));

    const providers = [...new Set(models.map((m) => m.provider))];

    res.json({
      ok: true,
      models,
      providers,
      currentModel: llmClient?.modelName || process.env.LLM_MODEL
    });
  });

  // 获取当前 LLM 配置（API Key 屏蔽）
  router.get('/llm/config', (_req, res) => {
    const stored = loadConfig(dataDir);
    res.json({
      ok: true,
      config: getPublicConfig(stored)
    });
  });

  // 更新 LLM 配置
  router.put('/llm/config', (req, res) => {
    const body = req.body || {};
    const current = loadConfig(dataDir);

    // 更新模型
    if (body.model) {
      try {
        resolveModel(body.model); // 验证模型名
      } catch (err) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      current.model = body.model;
    }

    // 更新温度
    if (body.temperature !== undefined) {
      const temp = parseFloat(body.temperature);
      if (Number.isFinite(temp) && temp >= 0 && temp <= 2) {
        current.temperature = temp;
      }
    }

    // 更新 API Keys（只更新传入的字段，空字符串表示清除）
    if (body.apiKeys && typeof body.apiKeys === 'object') {
      if (!current.apiKeys) current.apiKeys = {};
      for (const [key, value] of Object.entries(body.apiKeys)) {
        if (typeof value === 'string') {
          if (value === '') {
            delete current.apiKeys[key];
          } else {
            current.apiKeys[key] = value;
          }
        }
      }
    }

    // 持久化
    saveConfig(dataDir, current);

    // 应用到环境变量
    applyEnvVars(current);

    // 更新运行中的 LlmClient
    if (llmClient) {
      llmClient.modelName = current.model;
      try {
        llmClient.modelConfig = resolveModel(current.model);
      } catch {
        // 忽略解析错误
      }
    }

    res.json({
      ok: true,
      config: getPublicConfig(current),
      message: 'LLM 配置已保存并生效'
    });
  });

  // 测试 LLM 连接
  router.post('/llm/test', async (req, res) => {
    const body = req.body || {};
    const stored = loadConfig(dataDir);

    // 允许传入临时模型和 API Key 进行测试
    let testModel = body.model || stored.model;
    let testApiKeys = { ...(stored.apiKeys || {}) };

    if (body.apiKeys && typeof body.apiKeys === 'object') {
      for (const [key, value] of Object.entries(body.apiKeys)) {
        if (typeof value === 'string' && value !== '') {
          testApiKeys[key] = value;
        }
      }
    }

    // 临时应用环境变量
    const savedEnv = {};
    for (const [key, value] of Object.entries(testApiKeys)) {
      savedEnv[key] = process.env[key];
      process.env[key] = value;
    }

    try {
      const modelConfig = resolveModel(testModel);

      // 检查 API Key
      if (!modelConfig.apiKey && modelConfig.provider !== 'ollama') {
        const envKey = modelConfig.envVars?.[0] || 'API_KEY';
        return res.json({
          ok: false,
          error: `模型 ${testModel} 需要设置 ${envKey}`
        });
      }

      // 发送测试请求
      const testClient = new LlmClient({ modelName: testModel });
      const response = await testClient.chat('请回复"连接成功"四个字', {
        temperature: 0,
        maxTokens: 20
      });

      const textResponse = response.textResponse || '';

      res.json({
        ok: true,
        model: testModel,
        provider: modelConfig.provider,
        response: textResponse.slice(0, 200),
        message: '连接测试成功'
      });
    } catch (err) {
      res.json({
        ok: false,
        error: err.message || '连接测试失败'
      });
    } finally {
      // 恢复环境变量
      for (const [key, value] of Object.entries(savedEnv)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  return router;
}

module.exports = { createLlmRouter };

/**
 * LLM 客户端 — 统一入口，使用多模型路由器
 *
 * 通过 router.js 路由到各 LLM provider。
 * 调用方只需 llmClient.chat(prompt)，底层自动根据配置选择 provider。
 */

const { chat: routerChat, resolveModel, checkModelEnv, listSupportedModels } = require('./router');

class LlmClient {
  constructor(config = {}) {
    // 允许传入已解析的 modelConfig，或通过 modelName 解析
    this.modelName = config.modelName || config.model || process.env.LLM_MODEL || 'deepseek/deepseek-chat';
    this.modelConfig = config.modelConfig || null;

    if (config.modelConfig) {
      this.modelConfig = config.modelConfig;
    } else {
      this.modelConfig = resolveModel(this.modelName);
    }
  }

  /**
   * 发送聊天请求，返回 { textResponse, raw }
   */
  async chat(prompt, options = {}) {
    return routerChat(prompt, options, this.modelConfig);
  }

  /**
   * 检查当前模型的环境变量是否就绪
   */
  checkEnv() {
    return checkModelEnv(this.modelName);
  }

  /**
   * 获取当前模型信息
   */
  getModelInfo() {
    return {
      model: this.modelName,
      provider: this.modelConfig.provider,
      baseUrl: this.modelConfig.baseUrl,
      resolvedModel: this.modelConfig.model
    };
  }
}

module.exports = {
  LlmClient,
  listSupportedModels
};

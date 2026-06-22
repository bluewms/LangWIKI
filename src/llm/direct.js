/**
 * direct.js — 向后兼容的直连入口
 *
 * v0.2 起 LlmClient 直接使用 router 多模型路由，此文件仅保留导出兼容旧引用。
 */

const { chat, resolveModel } = require('./router');

async function directChat(prompt, options = {}, directConfig = {}) {
  const config = directConfig.provider
    ? directConfig
    : resolveModel(directConfig.model || process.env.LLM_MODEL || 'deepseek/deepseek-chat');
  return chat(prompt, options, config);
}

module.exports = {
  directChat
};

const { buildUserPreferencePrompt } = require('./prompts');

function parsePreferenceBlocks(response) {
  const text = typeof response === 'string'
    ? response
    : response?.textResponse || response?.content || response?.message || '';

  const regex = /<!--\s*(AUTO:[A-Z_]+)\s*-->\n?([\s\S]*?)\n?<!--\s*\/\1\s*-->/g;
  const blocks = {};
  let match;

  while ((match = regex.exec(text)) !== null) {
    blocks[match[1]] = (match[2] || '').trim();
  }

  return blocks;
}

async function extractUserPreferences(llmClient, chatHistory, existingWiki, schemaContent) {
  const prompt = buildUserPreferencePrompt(chatHistory, existingWiki, schemaContent);
  const response = await llmClient.chat(prompt);
  return parsePreferenceBlocks(response);
}

module.exports = {
  extractUserPreferences,
  parsePreferenceBlocks
};
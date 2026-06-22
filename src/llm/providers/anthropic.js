/**
 * Anthropic Claude provider
 * 文档: https://docs.anthropic.com/en/api/messages
 */

const ANTHROPIC_BASE = 'https://api.anthropic.com';
const ANTHROPIC_VERSION = '2023-06-01';

async function chat({ apiKey, model, prompt, options = {} }) {
  const url = `${ANTHROPIC_BASE}/v1/messages`;
  const messages = [{ role: 'user', content: prompt }];

  const body = {
    model,
    max_tokens: options.maxTokens || 4096,
    messages
  };
  if (options.system) body.system = options.system;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic chat failed (${model}): ${response.status} ${text}`);
  }

  const data = await response.json();
  const textResponse = data?.content?.[0]?.text || '';

  return { textResponse, raw: data };
}

module.exports = { chat };

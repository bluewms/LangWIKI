/**
 * OpenAI 兼容 provider — 覆盖 OpenAI / DeepSeek / 通义千问 / Ollama 等
 * 所有兼容 OpenAI Chat Completions API 的服务都走这里，仅 baseUrl / apiKey 不同
 */

async function chat({ baseUrl, apiKey, model, prompt, options = {} }) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: options.temperature ?? 0.3
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.system) body.messages.unshift({ role: 'system', content: options.system });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI-compatible chat failed (${model}): ${response.status} ${text}`);
  }

  const data = await response.json();
  const textResponse = data?.choices?.[0]?.message?.content || '';

  return { textResponse, raw: data };
}

module.exports = { chat };

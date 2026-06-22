/**
 * Google Gemini provider
 * 文档: https://ai.google.dev/api/rest/v1beta/models/generateContent
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

async function chat({ apiKey, model, prompt, options = {} }) {
  const url = `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxTokens || 8192
    }
  };
  if (options.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini chat failed (${model}): ${response.status} ${text}`);
  }

  const data = await response.json();
  const textResponse = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

  return { textResponse, raw: data };
}

module.exports = { chat };

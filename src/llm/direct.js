async function directChat(prompt, options = {}, directConfig = {}) {
  if (directConfig && typeof directConfig.chat === 'function') {
    return directConfig.chat(prompt, options);
  }

  const apiKey = directConfig.apiKey || process.env.OPENAI_API_KEY;
  const baseUrl = directConfig.baseUrl || 'https://api.openai.com/v1';
  const model = directConfig.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('Direct mode requires OPENAI_API_KEY or directConfig.apiKey');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Direct chat failed: ${response.status} ${text}`);
  }

  return response.json();
}

module.exports = {
  directChat
};
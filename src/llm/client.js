const { directChat } = require('./direct');

class LlmClient {
  constructor(config = {}) {
    this.anythingllmUrl = config.anythingllmUrl || 'http://localhost:3001';
    this.apiKey = config.apiKey || '';
    this.directMode = config.directMode || false;
    this.directConfig = config.directConfig || null;
  }

  async _proxyChat(prompt, options = {}) {
    const response = await fetch(`${this.anythingllmUrl}/api/system/openai/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: prompt, ...options })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AnythingLLM proxy chat failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  async _directChat(prompt, options = {}) {
    return directChat(prompt, options, this.directConfig || {});
  }

  async chat(prompt, options = {}) {
    if (this.directMode) {
      return this._directChat(prompt, options);
    }
    return this._proxyChat(prompt, options);
  }
}

module.exports = {
  LlmClient
};
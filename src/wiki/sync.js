class AnythingLLMSync {
  constructor(config = {}) {
    this.anythingllmUrl = (config.anythingllmUrl || 'http://localhost:3001').replace(/\/$/, '');
    this.sharedVolume = config.sharedVolume || '';
    this.mode = config.mode || 'shared-volume';
    this.apiKey = config.apiKey || '';
  }

  async notifyNewWiki(wikiPath) {
    if (this.mode === 'shared-volume') {
      return { ok: true, mode: 'shared-volume', wikiPath };
    }

    const response = await fetch(`${this.anythingllmUrl}/api/document/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath: wikiPath })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AnythingLLM sync failed: ${response.status} ${text}`);
    }

    return response.json();
  }
}

module.exports = {
  AnythingLLMSync
};
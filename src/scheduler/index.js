class Scheduler {
  constructor(anythingllmUrl, apiKey, options = {}) {
    this.anythingllmUrl = (anythingllmUrl || 'http://localhost:3001').replace(/\/$/, '');
    this.apiKey = apiKey || '';
    this.endpoint = options.endpoint || '/api/system/scheduled-jobs';
    this.callbackPath = options.callbackPath || '/api/langwiki/ingest/trigger';
    this.callbackBaseUrl = options.callbackBaseUrl || 'http://localhost:3100';
  }

  async _request(method, path, body) {
    const response = await fetch(`${this.anythingllmUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Scheduler request failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  async registerScanJob(workspaceId, cronExpression) {
    return this._request('POST', this.endpoint, {
      name: `langwiki-scan-${workspaceId}`,
      cronExpression,
      callbackUrl: `${this.callbackBaseUrl}${this.callbackPath}`,
      payload: { workspaceId }
    });
  }

  async listJobs() {
    return this._request('GET', this.endpoint);
  }

  async removeJob(jobId) {
    return this._request('DELETE', `${this.endpoint}/${jobId}`);
  }
}

module.exports = {
  Scheduler
};
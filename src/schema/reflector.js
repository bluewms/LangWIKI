class SchemaReflector {
  constructor(llmClient, options = {}) {
    this.llmClient = llmClient;
    this.maxRecords = options.maxRecords || 50;
    this.records = [];
  }

  recordIngest(ingestResult) {
    this.records.push(ingestResult);
    if (this.records.length > this.maxRecords) {
      this.records.shift();
    }
  }

  async reflect(schemaContent = '') {
    const prompt = `你是 schema 优化助手。请根据最近 ingest 结果提出 schema 优化建议。\n\n当前 schema:\n${schemaContent || '（空）'}\n\n最近结果:\n${JSON.stringify(this.records, null, 2)}\n\n请仅输出 JSON 数组，每个对象含字段：type, reason, change, confidence。`;

    const response = await this.llmClient.chat(prompt);
    const text = typeof response === 'string'
      ? response
      : response?.textResponse || response?.content || response?.message || '[]';

    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start === -1 || end === -1) return [];
      const parsed = JSON.parse(text.slice(start, end + 1));
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
}

module.exports = {
  SchemaReflector
};
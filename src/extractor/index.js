const { v4: uuidv4 } = require('uuid');
const { buildExtractionPrompt, buildSummaryPrompt } = require('./prompts');
const { computeEventFingerprint } = require('./fingerprint');

function extractJSONArray(text) {
  if (!text) return [];

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = (fenced?.[1] || text).trim();

  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return [];

  const candidate = raw.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function parseEventResponse(response, sourceSha256) {
  const modelText = typeof response === 'string'
    ? response
    : response?.textResponse || response?.content || response?.message || '';

  const events = extractJSONArray(modelText);

  return events.map((event) => {
    const normalized = {
      event_id: event.event_id || `evt_${uuidv4()}`,
      event_type: event.event_type || '未知事件',
      party: event.party || '',
      amount: Number(event.amount || 0),
      currency: event.currency || 'CNY',
      voucher_no: event.voucher_no || '',
      event_date: event.event_date || '',
      description: event.description || '',
      source_sha256: sourceSha256,
      updated_at: new Date().toISOString()
    };

    return {
      ...normalized,
      event_fingerprint: computeEventFingerprint(normalized)
    };
  });
}

function parseAutoBlocks(response) {
  const modelText = typeof response === 'string'
    ? response
    : response?.textResponse || response?.content || response?.message || '';

  const regex = /<!--\s*(AUTO:[A-Z_]+)\s*-->\n?([\s\S]*?)\n?<!--\s*\/\1\s*-->/g;
  const blocks = {};

  let match;
  while ((match = regex.exec(modelText)) !== null) {
    const key = match[1];
    const content = (match[2] || '').trim();
    blocks[key] = content;
  }

  return blocks;
}

async function extractEvents(llmClient, fileText, fileName, entityName, fileHash, schemaContent) {
  const prompt = buildExtractionPrompt(fileText, fileName, entityName, schemaContent);
  const response = await llmClient.chat(prompt);
  return parseEventResponse(response, fileHash);
}

async function generateWikiBlocks(llmClient, entityName, events, existingWiki, schemaContent) {
  const prompt = buildSummaryPrompt(entityName, events, existingWiki, schemaContent);
  const response = await llmClient.chat(prompt);
  return parseAutoBlocks(response);
}

module.exports = {
  extractEvents,
  generateWikiBlocks,
  parseEventResponse,
  parseAutoBlocks,
  extractJSONArray
};
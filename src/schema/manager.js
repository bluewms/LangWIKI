const fs = require('fs');
const path = require('path');

function ensureSchemaDir(rootDir) {
  const dir = path.join(rootDir, '.LangWIKI');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSchemaPath(rootDir) {
  return path.join(ensureSchemaDir(rootDir), 'schema.md');
}

function getSuggestionsPath(rootDir) {
  return path.join(ensureSchemaDir(rootDir), 'schema-suggestions.jsonl');
}

function loadSchema(rootDir) {
  const schemaPath = getSchemaPath(rootDir);
  if (!fs.existsSync(schemaPath)) return '';
  return fs.readFileSync(schemaPath, 'utf-8');
}

function saveSchema(rootDir, content) {
  const schemaPath = getSchemaPath(rootDir);
  fs.writeFileSync(schemaPath, content, 'utf-8');
  return schemaPath;
}

function readSuggestions(rootDir) {
  const suggestionsPath = getSuggestionsPath(rootDir);
  if (!fs.existsSync(suggestionsPath)) return [];

  const content = fs.readFileSync(suggestionsPath, 'utf-8').trim();
  if (!content) return [];

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeSuggestions(rootDir, suggestions) {
  const suggestionsPath = getSuggestionsPath(rootDir);
  const payload = suggestions.map((s) => JSON.stringify(s)).join('\n');
  fs.writeFileSync(suggestionsPath, payload ? `${payload}\n` : '', 'utf-8');
}

function addSuggestion(rootDir, suggestion) {
  const item = {
    id: suggestion.id || `sug_${Date.now()}`,
    type: suggestion.type || 'unknown',
    reason: suggestion.reason || '',
    change: suggestion.change || '',
    confidence: suggestion.confidence ?? null,
    status: suggestion.status || 'pending',
    createdAt: suggestion.createdAt || new Date().toISOString()
  };

  const suggestions = readSuggestions(rootDir);
  suggestions.push(item);
  writeSuggestions(rootDir, suggestions);
  return item;
}

function getPendingSuggestions(rootDir) {
  return readSuggestions(rootDir).filter((s) => s.status === 'pending');
}

function adoptSuggestion(rootDir, suggestionId) {
  const suggestions = readSuggestions(rootDir);
  const idx = suggestions.findIndex((s) => s.id === suggestionId);
  if (idx === -1) throw new Error(`Suggestion not found: ${suggestionId}`);

  suggestions[idx].status = 'adopted';
  suggestions[idx].adoptedAt = new Date().toISOString();
  writeSuggestions(rootDir, suggestions);

  const currentSchema = loadSchema(rootDir);
  const nextSchema = [currentSchema.trim(), suggestions[idx].change].filter(Boolean).join('\n\n');
  saveSchema(rootDir, nextSchema);

  return suggestions[idx];
}

function ignoreSuggestion(rootDir, suggestionId) {
  const suggestions = readSuggestions(rootDir);
  const idx = suggestions.findIndex((s) => s.id === suggestionId);
  if (idx === -1) throw new Error(`Suggestion not found: ${suggestionId}`);

  suggestions[idx].status = 'ignored';
  suggestions[idx].ignoredAt = new Date().toISOString();
  writeSuggestions(rootDir, suggestions);
  return suggestions[idx];
}

module.exports = {
  loadSchema,
  saveSchema,
  addSuggestion,
  getPendingSuggestions,
  adoptSuggestion,
  ignoreSuggestion,
  readSuggestions
};
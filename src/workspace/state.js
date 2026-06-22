const fs = require('fs');
const path = require('path');

const LANGWIKI_DIR = '.LangWIKI';
const ENTITIES_DIR = 'entities';

function getEntityDir(rootDir, entityName) {
  return path.join(rootDir, LANGWIKI_DIR, ENTITIES_DIR, entityName);
}

function ensureStateDir(rootDir, entityName) {
  const entityDir = getEntityDir(rootDir, entityName);
  fs.mkdirSync(path.join(entityDir, 'versions'), { recursive: true });
  return entityDir;
}

function loadState(rootDir, entityName) {
  const statePath = path.join(getEntityDir(rootDir, entityName), 'state.json');
  if (!fs.existsSync(statePath)) {
    return {
      lastScanTime: null,
      version: 0,
      processedFiles: {},
      lastKnowledgeSyncTime: null
    };
  }

  return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
}

function saveState(rootDir, entityName, state) {
  ensureStateDir(rootDir, entityName);
  const statePath = path.join(getEntityDir(rootDir, entityName), 'state.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  return statePath;
}

function readEvents(rootDir, entityName) {
  const eventsPath = path.join(getEntityDir(rootDir, entityName), 'events.jsonl');
  if (!fs.existsSync(eventsPath)) return [];

  const content = fs.readFileSync(eventsPath, 'utf-8').trim();
  if (!content) return [];

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function appendEventsDedup(rootDir, entityName, newEvents = []) {
  ensureStateDir(rootDir, entityName);
  const eventsPath = path.join(getEntityDir(rootDir, entityName), 'events.jsonl');

  const existing = readEvents(rootDir, entityName);
  const fingerprints = new Set(
    existing
      .map((event) => event.event_fingerprint)
      .filter(Boolean)
  );

  const accepted = [];
  for (const event of newEvents) {
    if (!event || !event.event_fingerprint) continue;
    if (fingerprints.has(event.event_fingerprint)) continue;
    fingerprints.add(event.event_fingerprint);
    accepted.push(event);
  }

  if (accepted.length > 0) {
    const payload = accepted.map((event) => JSON.stringify(event)).join('\n') + '\n';
    fs.appendFileSync(eventsPath, payload, 'utf-8');
  }

  return accepted.length;
}

function saveVersionSnapshot(rootDir, entityName, wikiContent) {
  ensureStateDir(rootDir, entityName);
  const versionsDir = path.join(getEntityDir(rootDir, entityName), 'versions');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(versionsDir, `${timestamp}.md`);
  fs.writeFileSync(filePath, wikiContent, 'utf-8');
  return filePath;
}

module.exports = {
  LANGWIKI_DIR,
  ENTITIES_DIR,
  getEntityDir,
  ensureStateDir,
  loadState,
  saveState,
  appendEventsDedup,
  saveVersionSnapshot
};
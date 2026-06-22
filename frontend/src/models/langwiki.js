const jsonHeaders = { 'Content-Type': 'application/json' };

function withRootDir(path, rootDir) {
  if (!rootDir) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}rootDir=${encodeURIComponent(rootDir)}`;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function getIngestStatus() {
  return request('/api/langwiki/ingest/status');
}

export async function triggerInitialIngest(rootDir, outputRootDir) {
  const payload = {};
  if (rootDir) payload.rootDir = rootDir;
  if (outputRootDir) payload.outputRootDir = outputRootDir;

  return request('/api/langwiki/ingest/initial', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function triggerEntityIngest(entityName, rootDir, outputRootDir) {
  const payload = { entityName };
  if (rootDir) payload.rootDir = rootDir;
  if (outputRootDir) payload.outputRootDir = outputRootDir;

  return request('/api/langwiki/ingest/trigger', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function pauseIngest() {
  return request('/api/langwiki/ingest/pause', {
    method: 'POST',
    headers: jsonHeaders,
    body: '{}'
  });
}

export async function resumeIngest() {
  return request('/api/langwiki/ingest/resume', {
    method: 'POST',
    headers: jsonHeaders,
    body: '{}'
  });
}

export async function queryWiki(q, rootDir) {
  const params = new URLSearchParams({ q });
  return request(withRootDir(`/api/langwiki/query?${params.toString()}`, rootDir));
}

export async function askWiki(question, rootDir) {
  return request('/api/langwiki/ask', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(rootDir ? { question, rootDir } : { question })
  });
}

export async function getEntityWiki(name, rootDir) {
  return request(withRootDir(`/api/langwiki/entities/${encodeURIComponent(name)}/wiki`, rootDir));
}

export async function listEntities(rootDir) {
  return request(withRootDir('/api/langwiki/entities', rootDir));
}

export async function listWorkspaces() {
  return request('/api/langwiki/workspaces');
}

export async function createWorkspace(payload) {
  return request('/api/langwiki/workspaces', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function updateWorkspace(id, payload) {
  return request(`/api/langwiki/workspaces/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function deleteWorkspace(id, deleteFiles = true) {
  const suffix = deleteFiles ? '?deleteFiles=true' : '';
  return request(`/api/langwiki/workspaces/${encodeURIComponent(id)}${suffix}`, {
    method: 'DELETE'
  });
}

export async function listFilesystemDirs(currentPath = '') {
  const url = currentPath
    ? `/api/langwiki/filesystem/dirs?path=${encodeURIComponent(currentPath)}`
    : '/api/langwiki/filesystem/dirs';

  return request(url);
}

export async function getWorkspaceTree(id) {
  return request(`/api/langwiki/workspaces/${encodeURIComponent(id)}/tree`);
}

export async function getWorkspaceDocument(id, filePath) {
  const params = new URLSearchParams({ path: filePath });
  return request(`/api/langwiki/workspaces/${encodeURIComponent(id)}/document?${params.toString()}`);
}

export async function getSchema(rootDir) {
  return request(withRootDir('/api/langwiki/schema', rootDir));
}

export async function saveSchema(content, rootDir) {
  return request(withRootDir('/api/langwiki/schema', rootDir), {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ content })
  });
}

export async function getSchemaSuggestions(rootDir) {
  return request(withRootDir('/api/langwiki/schema/suggestions', rootDir));
}

export async function adoptSchemaSuggestion(id, rootDir) {
  return request(withRootDir(`/api/langwiki/schema/suggestions/${id}/adopt`, rootDir), {
    method: 'POST',
    headers: jsonHeaders,
    body: '{}'
  });
}

export async function ignoreSchemaSuggestion(id, rootDir) {
  return request(withRootDir(`/api/langwiki/schema/suggestions/${id}/ignore`, rootDir), {
    method: 'POST',
    headers: jsonHeaders,
    body: '{}'
  });
}

export async function getUserContext(username = 'default') {
  return request(`/api/langwiki/users/${encodeURIComponent(username)}/context`);
}

export async function getLlmModels() {
  return request('/api/langwiki/llm/models');
}

export async function getLlmConfig() {
  return request('/api/langwiki/llm/config');
}

export async function updateLlmConfig(payload) {
  return request('/api/langwiki/llm/config', {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function testLlmConnection(payload) {
  return request('/api/langwiki/llm/test', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
}

export async function getUserWiki(username = 'default') {
  return request(`/api/langwiki/users/${encodeURIComponent(username)}/wiki`);
}

export async function updateUserProfile(username = 'default', autoBlocks = {}) {
  return request(`/api/langwiki/users/${encodeURIComponent(username)}/profile`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ autoBlocks })
  });
}

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

function getRegistryPath(dataDir) {
  return path.join(dataDir, 'workspaces.json');
}

function loadRegistry(dataDir) {
  const filePath = getRegistryPath(dataDir);
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return [];
  }
}

function saveRegistry(dataDir, list) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(getRegistryPath(dataDir), JSON.stringify(list, null, 2), 'utf-8');
}

function findNextWorkspaceName(workspaces) {
  const used = new Set(workspaces.map((item) => item.name || item.id));
  let n = 1;
  while (used.has(`新建工作${n}`)) n += 1;
  return `新建工作${n}`;
}

function findNextWorkspaceId(workspaces) {
  const used = new Set(workspaces.map((item) => item.id));
  let n = 1;
  let candidate = `ws-${String(n).padStart(3, '0')}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `ws-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

function normalizeGitSettings(git = {}) {
  return {
    enabled: Boolean(git.enabled),
    remoteUrl: String(git.remoteUrl || ''),
    branch: String(git.branch || 'main')
  };
}

function normalizeWorkspace(item, dataDir) {
  const id = String(item.id || '').trim();
  if (!id) return null;

  return {
    id,
    name: String(item.name || id).trim() || id,
    rootDir: String(item.rootDir || path.join(dataDir, 'workspaces', id)),
    sourceDir: String(item.sourceDir || ''),
    git: normalizeGitSettings(item.git || {}),
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

function resolveWorkspaceById(dataDir, id) {
  const workspaces = loadRegistry(dataDir)
    .map((item) => normalizeWorkspace(item, dataDir))
    .filter(Boolean);

  return workspaces.find((item) => item.id === id) || null;
}

function safeJoin(rootDir, relativePath) {
  const safeRoot = path.resolve(rootDir);
  const target = path.resolve(safeRoot, relativePath);
  if (target !== safeRoot && !target.startsWith(`${safeRoot}${path.sep}`)) {
    return null;
  }
  return target;
}

function buildTree(rootDir, relativeDir = '', depth = 0) {
  if (depth > 6) return [];

  const absDir = safeJoin(rootDir, relativeDir || '.');
  if (!absDir || !fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) return [];

  const entries = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.') || entry.name === '.LangWIKI')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    });

  return entries
    .map((entry) => {
      const childRelative = relativeDir ? path.posix.join(relativeDir, entry.name) : entry.name;

      if (entry.isDirectory()) {
        return {
          type: 'dir',
          name: entry.name,
          path: childRelative,
          children: buildTree(rootDir, childRelative, depth + 1)
        };
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        return {
          type: 'file',
          name: entry.name,
          path: childRelative
        };
      }

      return null;
    })
    .filter(Boolean);
}

function listDirectories(targetPath = '') {
  const current = targetPath ? path.resolve(String(targetPath)) : os.homedir();
  if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) {
    return null;
  }

  const children = fs
    .readdirSync(current, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({
      name: entry.name,
      path: path.join(current, entry.name)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

  return {
    current,
    parent: path.dirname(current) === current ? null : path.dirname(current),
    children
  };
}

function createWorkspaceRouter(config = {}) {
  const router = express.Router();
  const dataDir = config.dataDir;

  router.get('/workspaces', (_req, res) => {
    const workspaces = loadRegistry(dataDir)
      .map((item) => normalizeWorkspace(item, dataDir))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json({ ok: true, workspaces });
  });

  router.post('/workspaces', (req, res) => {
    const body = req.body || {};
    const workspaces = loadRegistry(dataDir)
      .map((item) => normalizeWorkspace(item, dataDir))
      .filter(Boolean);

    const id = String(body.id || '').trim() || findNextWorkspaceId(workspaces);
    const existing = workspaces.find((item) => item.id === id);
    const name = String(body.name || '').trim() || existing?.name || findNextWorkspaceName(workspaces);
    const rootDir = String(body.rootDir || '').trim() || existing?.rootDir || path.join(dataDir, 'workspaces', id);
    const sourceDir = Object.prototype.hasOwnProperty.call(body, 'sourceDir')
      ? String(body.sourceDir || '').trim()
      : (existing?.sourceDir || '');

    if (sourceDir && (!path.isAbsolute(sourceDir) || !fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory())) {
      return res.status(400).json({ ok: false, error: 'sourceDir must be an existing absolute directory path' });
    }

    const git = normalizeGitSettings({ ...(existing?.git || {}), ...(body.git || {}) });
    const workspace = {
      id,
      name,
      rootDir,
      sourceDir,
      git,
      updatedAt: new Date().toISOString()
    };

    fs.mkdirSync(rootDir, { recursive: true });

    const next = workspaces.filter((item) => item.id !== id);
    next.push(workspace);
    saveRegistry(dataDir, next);

    return res.json({ ok: true, workspace });
  });

  router.patch('/workspaces/:id', (req, res) => {
    const workspaces = loadRegistry(dataDir)
      .map((item) => normalizeWorkspace(item, dataDir))
      .filter(Boolean);

    const targetId = req.params.id;
    const current = workspaces.find((item) => item.id === targetId);
    if (!current) {
      return res.status(404).json({ ok: false, error: 'workspace not found' });
    }

    const payload = req.body || {};
    const nextName = typeof payload.name === 'string' && payload.name.trim() ? payload.name.trim() : current.name;

    let nextSourceDir = current.sourceDir;
    if (Object.prototype.hasOwnProperty.call(payload, 'sourceDir')) {
      const maybeSource = String(payload.sourceDir || '').trim();
      if (maybeSource) {
        if (!path.isAbsolute(maybeSource) || !fs.existsSync(maybeSource) || !fs.statSync(maybeSource).isDirectory()) {
          return res.status(400).json({ ok: false, error: 'sourceDir must be an existing absolute directory path' });
        }
        nextSourceDir = maybeSource;
      } else {
        nextSourceDir = '';
      }
    }

    const nextWorkspace = {
      ...current,
      name: nextName,
      sourceDir: nextSourceDir,
      git: normalizeGitSettings({ ...(current.git || {}), ...(payload.git || {}) }),
      updatedAt: new Date().toISOString()
    };

    const next = workspaces.map((item) => (item.id === targetId ? nextWorkspace : item));
    saveRegistry(dataDir, next);
    return res.json({ ok: true, workspace: nextWorkspace });
  });

  router.delete('/workspaces/:id', (req, res) => {
    const workspaces = loadRegistry(dataDir)
      .map((item) => normalizeWorkspace(item, dataDir))
      .filter(Boolean);

    const targetId = req.params.id;
    const current = workspaces.find((item) => item.id === targetId);
    if (!current) {
      return res.status(404).json({ ok: false, error: 'workspace not found' });
    }

    const deleteFiles = String(req.query.deleteFiles || '').toLowerCase() === 'true';
    const managedRoot = path.resolve(path.join(dataDir, 'workspaces'));
    const workspaceRoot = path.resolve(current.rootDir);

    if (deleteFiles) {
      const knowledgeDir = path.join(workspaceRoot, '.LangWIKI');
      if (fs.existsSync(knowledgeDir)) {
        fs.rmSync(knowledgeDir, { recursive: true, force: true });
      }

      if (workspaceRoot.startsWith(`${managedRoot}${path.sep}`) && fs.existsSync(workspaceRoot)) {
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
      }
    }

    const next = workspaces.filter((item) => item.id !== targetId);
    saveRegistry(dataDir, next);

    return res.json({ ok: true, deletedWorkspace: current, deletedFiles: deleteFiles });
  });

  router.get('/filesystem/dirs', (req, res) => {
    const targetPath = String(req.query.path || '').trim();
    const result = listDirectories(targetPath);
    if (!result) {
      return res.status(400).json({ ok: false, error: 'directory not found' });
    }

    return res.json({ ok: true, ...result });
  });

  router.get('/workspaces/:id/tree', (req, res) => {
    const workspace = resolveWorkspaceById(dataDir, req.params.id);
    if (!workspace) {
      return res.status(404).json({ ok: false, error: 'workspace not found' });
    }

    const tree = buildTree(workspace.rootDir);
    return res.json({ ok: true, workspace, tree });
  });

  router.get('/workspaces/:id/document', (req, res) => {
    const workspace = resolveWorkspaceById(dataDir, req.params.id);
    if (!workspace) {
      return res.status(404).json({ ok: false, error: 'workspace not found' });
    }

    const relativePath = String(req.query.path || '').trim();
    if (!relativePath || !relativePath.toLowerCase().endsWith('.md')) {
      return res.status(400).json({ ok: false, error: 'valid markdown path is required' });
    }

    const absPath = safeJoin(workspace.rootDir, relativePath);
    if (!absPath || !fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
      return res.status(404).json({ ok: false, error: 'document not found' });
    }

    const content = fs.readFileSync(absPath, 'utf-8');
    return res.json({ ok: true, workspace, path: relativePath, content });
  });

  return router;
}

module.exports = {
  createWorkspaceRouter,
  loadRegistry,
  saveRegistry,
  resolveWorkspaceById,
  buildTree
};

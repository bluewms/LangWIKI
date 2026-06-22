const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IGNORED_DIRS = ['.LangWIKI', '.git', 'node_modules', '.DS_Store'];

function computeFileSha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push({
        name: entry.name,
        path: fullPath,
        sha256: computeFileSha256(fullPath)
      });
    }
  }

  return files;
}

function scanDirectory(rootDir) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  const subdirs = entries
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRS.includes(entry.name))
    .map((entry) => ({ name: entry.name, path: path.join(rootDir, entry.name) }));

  const files = entries
    .filter((entry) => entry.isFile() && !IGNORED_DIRS.includes(entry.name))
    .map((entry) => {
      const fullPath = path.join(rootDir, entry.name);
      return { name: entry.name, path: fullPath, sha256: computeFileSha256(fullPath) };
    });

  return { subdirs, files };
}

module.exports = {
  IGNORED_DIRS,
  computeFileSha256,
  listFiles,
  scanDirectory
};
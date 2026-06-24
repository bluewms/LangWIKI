const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IGNORED_DIRS = ['.LangWIKI', '.git', 'node_modules', '.DS_Store'];

function computeFileSha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 文件类型分组 → 扩展名映射
 * 用于 ingest 时按类型过滤
 */
const FILE_TYPE_EXTENSIONS = {
  pdf:    ['.pdf'],
  word:   ['.docx', '.doc'],
  ppt:    ['.pptx', '.ppt'],
  excel:  ['.xlsx', '.xls', '.csv', '.tsv'],
  image:  ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
  email:  ['.eml'],
  text:   ['.txt', '.md', '.markdown', '.log', '.json', '.yaml', '.yml', '.xml', '.html', '.htm'],
  code:   ['.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.sh', '.sql', '.rb', '.php', '.vue']
};

/** 文件类型分组 → 显示标签 */
const FILE_TYPE_LABELS = {
  pdf:   'PDF',
  word:  'Word',
  ppt:   'PowerPoint',
  excel: 'Excel/CSV',
  image: '图片 (OCR)',
  email: '邮件',
  text:  '纯文本',
  code:  '代码'
};

/**
 * 将文件类型组名列表转为扩展名集合
 * @param {string[]} types - 如 ['pdf', 'word']
 * @returns {Set<string>|null} 扩展名集合，null 表示不过滤
 */
function resolveExtensions(types) {
  if (!types || !Array.isArray(types) || types.length === 0) return null;
  const exts = new Set();
  for (const t of types) {
    const arr = FILE_TYPE_EXTENSIONS[t];
    if (arr) arr.forEach((e) => exts.add(e.toLowerCase()));
  }
  return exts.size > 0 ? exts : null;
}

function listFiles(dir, options = {}) {
  if (!fs.existsSync(dir)) return [];

  const allowExts = resolveExtensions(options.fileTypes);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, options));
      continue;
    }

    if (entry.isFile()) {
      if (allowExts) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowExts.has(ext)) continue;
      }
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
  FILE_TYPE_EXTENSIONS,
  FILE_TYPE_LABELS,
  resolveExtensions,
  computeFileSha256,
  listFiles,
  scanDirectory
};
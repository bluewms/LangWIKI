const path = require('path');
const chokidar = require('chokidar');

class FileWatcher {
  constructor(rootDir, options = {}) {
    this.rootDir = rootDir;
    this.debounceMs = options.debounceMs || 300000;
    this.onBatch = options.onBatch || (() => {});

    this.watcher = null;
    this.pendingChanges = new Map();
    this.timers = new Map();
  }

  _isIgnored(filePath) {
    return filePath.includes(`${path.sep}.LangWIKI${path.sep}`)
      || filePath.includes(`${path.sep}.git${path.sep}`)
      || filePath.includes(`${path.sep}node_modules${path.sep}`);
  }

  _resolveEntity(filePath) {
    const relative = path.relative(this.rootDir, filePath);
    if (!relative || relative.startsWith('..')) return null;

    const [entityName] = relative.split(path.sep);
    if (!entityName || entityName.startsWith('.')) return null;
    return entityName;
  }

  _schedule(entityName) {
    const currentTimer = this.timers.get(entityName);
    if (currentTimer) clearTimeout(currentTimer);

    const timer = setTimeout(() => {
      const files = Array.from(this.pendingChanges.get(entityName) || []);
      this.pendingChanges.delete(entityName);
      this.timers.delete(entityName);

      if (files.length > 0) {
        this.onBatch({ entityName, files });
      }
    }, this.debounceMs);

    this.timers.set(entityName, timer);
  }

  _collect(filePath) {
    if (this._isIgnored(filePath)) return;

    const entityName = this._resolveEntity(filePath);
    if (!entityName) return;

    const existing = this.pendingChanges.get(entityName) || new Set();
    existing.add(filePath);
    this.pendingChanges.set(entityName, existing);
    this._schedule(entityName);
  }

  start() {
    this.watcher = chokidar.watch(this.rootDir, {
      ignoreInitial: true,
      persistent: true,
      ignored: (watchedPath) => this._isIgnored(watchedPath)
    });

    this.watcher
      .on('add', (filePath) => this._collect(filePath))
      .on('change', (filePath) => this._collect(filePath))
      .on('unlink', (filePath) => this._collect(filePath));

    return this.watcher;
  }

  async stop() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pendingChanges.clear();

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = {
  FileWatcher
};
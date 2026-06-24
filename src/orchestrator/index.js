const fs = require('fs');
const path = require('path');

const { TaskQueue, PRIORITY } = require('../queue');
const { scanDirectory, listFiles } = require('../workspace/scanner');
const {
  loadState,
  saveState,
  appendEventsDedup,
  saveVersionSnapshot
} = require('../workspace/state');
const { parse } = require('../parser');
const { extractEvents, generateWikiBlocks } = require('../extractor');
const { createInitialWiki, updateWikiContent, readWikiFile, writeWikiFile } = require('../builder');
const { updateIndex } = require('../wiki/index');
const { appendLog } = require('../wiki/log');

function loadSchema(rootDir) {
  const schemaPath = path.join(rootDir, '.LangWIKI', 'schema.md');
  if (!fs.existsSync(schemaPath)) return '';
  return fs.readFileSync(schemaPath, 'utf-8');
}

class Orchestrator {
  constructor(llmClient, config = {}) {
    this.llmClient = llmClient;
    this.kbRoot = config.kbRoot || null;
    this.queue = config.queue || new TaskQueue(config.rateControl || {});

    if (typeof this.queue.on === 'function') {
      this.queue.on('execute', async (job) => {
        switch (job.type) {
          case 'ingest-file':
            return this._ingestSingleFile(job.payload);
          case 'ingest-entity':
            return this.ingest(job.payload.rootDir, job.payload.entityName, job.payload.options);
          default:
            return null;
        }
      });
    }
  }

  scheduleInitialScan(rootDir, options = {}) {
    const outputRootDir = options.outputRootDir || rootDir;
    const fileTypes = options.fileTypes || null;
    const scan = scanDirectory(rootDir);
    const jobs = scan.subdirs.map((dir) => ({
      type: 'ingest-entity',
      payload: {
        rootDir,
        entityName: dir.name,
        options: { mode: 'initial', outputRootDir, fileTypes }
      }
    }));

    return this.queue.enqueueBatch(jobs, PRIORITY.LOW);
  }

  scheduleIncrementalScan(rootDir, entityName, options = {}) {
    const outputRootDir = options.outputRootDir || rootDir;
    return this.queue.enqueue({
      type: 'ingest-entity',
      payload: { rootDir, entityName, options: { mode: 'incremental', outputRootDir } },
      priority: PRIORITY.NORMAL
    });
  }

  scheduleManualIngest(rootDir, entityName, options = {}) {
    const outputRootDir = options.outputRootDir || rootDir;
    return this.queue.enqueue({
      type: 'ingest-entity',
      payload: { rootDir, entityName, options: { mode: 'manual', outputRootDir } },
      priority: PRIORITY.HIGH
    });
  }

  async _ingestSingleFile(payload) {
    const { filePath, entityName, schemaContent = '', fileHash = '' } = payload;
    const fileText = await parse(filePath);
    return extractEvents(
      this.llmClient,
      fileText,
      path.basename(filePath),
      entityName,
      fileHash,
      schemaContent
    );
  }

  async ingest(rootDir, entityName, options = {}) {
    const outputRootDir = options.outputRootDir || rootDir;
    const entityRawDir = path.join(rootDir, entityName);
    const schemaContent = loadSchema(outputRootDir);
    const prevState = loadState(outputRootDir, entityName);

    const files = listFiles(entityRawDir, { fileTypes: options.fileTypes });
    const changedFiles = files.filter((file) => prevState.processedFiles?.[file.name] !== file.sha256);

    if (changedFiles.length === 0 && !options.force) {
      return {
        entityName,
        processedFiles: 0,
        newEvents: 0,
        skipped: true
      };
    }

    const extracted = [];
    for (const file of changedFiles) {
      const fileText = await parse(file.path);
      const events = await extractEvents(
        this.llmClient,
        fileText,
        file.name,
        entityName,
        file.sha256,
        schemaContent
      );

      extracted.push(...events);
    }

    const appendedCount = appendEventsDedup(outputRootDir, entityName, extracted);

    let wikiContent = readWikiFile(outputRootDir, entityName);
    if (!wikiContent) {
      wikiContent = createInitialWiki(entityName, '客户', entityRawDir);
    } else {
      saveVersionSnapshot(outputRootDir, entityName, wikiContent);
    }

    const autoBlocks = await generateWikiBlocks(
      this.llmClient,
      entityName,
      extracted,
      wikiContent,
      schemaContent
    );

    const nextWiki = updateWikiContent(wikiContent, autoBlocks);
    const wikiPath = writeWikiFile(outputRootDir, entityName, nextWiki);

    const processedFiles = {
      ...(prevState.processedFiles || {})
    };
    for (const file of changedFiles) {
      processedFiles[file.name] = file.sha256;
    }

    saveState(outputRootDir, entityName, {
      ...prevState,
      version: (prevState.version || 0) + 1,
      lastScanTime: new Date().toISOString(),
      processedFiles
    });

    updateIndex(outputRootDir, [
      {
        name: entityName,
        wikiPath: `entities/${entityName}/${entityName}-wiki.md`,
        summary: `最近更新：${new Date().toISOString().slice(0, 10)}`
      }
    ]);

    appendLog(outputRootDir, {
      action: 'ingest',
      entity: entityName,
      lines: [
        `新增或变更文件: ${changedFiles.length} 个`,
        `提取事件: ${appendedCount} 条`
      ]
    });

    return {
      entityName,
      processedFiles: changedFiles.length,
      newEvents: appendedCount,
      wikiPath
    };
  }

  async ingestAll(workspace, options = {}) {
    const outputRootDir = options.outputRootDir || workspace.rootDir;
    const scan = scanDirectory(workspace.sourceDir || workspace.rootDir);
    const results = [];

    for (const dir of scan.subdirs) {
      const result = await this.ingest(workspace.sourceDir || workspace.rootDir, dir.name, {
        ...options,
        outputRootDir
      });
      results.push(result);
    }

    return results;
  }
}

module.exports = {
  Orchestrator
};
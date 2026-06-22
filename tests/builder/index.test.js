const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  createInitialWiki,
  updateWikiContent,
  readWikiFile,
  writeWikiFile
} = require('../../src/builder');

describe('builder/index', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-builder-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('createInitialWiki should include manual and auto placeholders', () => {
    const markdown = createInitialWiki('富士康', '客户', '/data/business/富士康');

    expect(markdown).toContain('<!-- MANUAL:NOTES -->');
    expect(markdown).toContain('<!-- AUTO:SUMMARY -->');
    expect(markdown).toContain('<!-- AUTO:TIMELINE -->');
  });

  test('updateWikiContent should update AUTO blocks and keep MANUAL blocks', () => {
    const existing = `# 富士康业务档案\n\n<!-- MANUAL:NOTES -->\n人工备注\n<!-- /MANUAL:NOTES -->\n\n<!-- AUTO:SUMMARY -->\n旧摘要\n<!-- /AUTO:SUMMARY -->`;

    const next = updateWikiContent(existing, {
      'AUTO:SUMMARY': '新摘要',
      'AUTO:PAYMENTS': '总收入：5000'
    });

    expect(next).toContain('人工备注');
    expect(next).toContain('新摘要');
    expect(next).toContain('<!-- AUTO:PAYMENTS -->');
    expect(next).toContain('总收入：5000');
  });

  test('readWikiFile/writeWikiFile should persist wiki content', () => {
    const content = '# wiki content';
    writeWikiFile(tempRoot, '富士康', content);

    const loaded = readWikiFile(tempRoot, '富士康');
    expect(loaded).toBe(content);
  });
});

const fs = require('fs');
const os = require('os');
const path = require('path');

const { scanDirectory, listFiles } = require('../../src/workspace/scanner');

describe('workspace/scanner', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-scan-'));

    fs.mkdirSync(path.join(tempRoot, '客户A'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, '.LangWIKI'), { recursive: true });
    fs.mkdirSync(path.join(tempRoot, '.git'), { recursive: true });

    fs.writeFileSync(path.join(tempRoot, '客户A', '合同.txt'), '合同内容A', 'utf-8');
    fs.writeFileSync(path.join(tempRoot, '.LangWIKI', 'ignore.txt'), 'ignore', 'utf-8');
    fs.writeFileSync(path.join(tempRoot, '.git', 'config'), 'ignore', 'utf-8');
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  test('scanDirectory should return only non-ignored subdirs', () => {
    const result = scanDirectory(tempRoot);
    const names = result.subdirs.map((d) => d.name);

    expect(names).toEqual(['客户A']);
  });

  test('listFiles should recursively list files with sha256', () => {
    const files = listFiles(path.join(tempRoot, '客户A'));

    expect(files).toHaveLength(1);
    expect(files[0]).toEqual(
      expect.objectContaining({
        name: '合同.txt',
        path: path.join(tempRoot, '客户A', '合同.txt'),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/)
      })
    );
  });
});

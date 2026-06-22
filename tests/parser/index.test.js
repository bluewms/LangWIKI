const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../src/parser/pdf', () => ({ parsePDF: jest.fn(async () => 'pdf-content') }));
jest.mock('../../src/parser/image', () => ({ parseImage: jest.fn(async () => 'image-content') }));
jest.mock('../../src/parser/spreadsheet', () => ({ parseSpreadsheet: jest.fn(async () => 'sheet-content') }));
jest.mock('../../src/parser/email', () => ({ parseEmail: jest.fn(async () => 'email-content') }));

const { parse, parseText } = require('../../src/parser');
const { parsePDF } = require('../../src/parser/pdf');
const { parseImage } = require('../../src/parser/image');
const { parseSpreadsheet } = require('../../src/parser/spreadsheet');
const { parseEmail } = require('../../src/parser/email');

describe('parser/index', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'langwiki-parser-'));
  });

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  test('parseText should read utf8 text file', async () => {
    const filePath = path.join(tempRoot, 'a.txt');
    fs.writeFileSync(filePath, 'hello parser', 'utf-8');

    const text = await parseText(filePath);
    expect(text).toBe('hello parser');
  });

  test('parse should route .pdf to parsePDF', async () => {
    const filePath = path.join(tempRoot, 'a.pdf');
    fs.writeFileSync(filePath, 'x');

    const output = await parse(filePath);

    expect(parsePDF).toHaveBeenCalledWith(filePath, {});
    expect(output).toBe('pdf-content');
  });

  test('parse should route image to parseImage', async () => {
    const filePath = path.join(tempRoot, 'a.jpg');
    fs.writeFileSync(filePath, 'x');

    await parse(filePath, { lang: 'chi_sim' });

    expect(parseImage).toHaveBeenCalledWith(filePath, { lang: 'chi_sim' });
  });

  test('parse should route spreadsheet to parseSpreadsheet', async () => {
    const filePath = path.join(tempRoot, 'a.csv');
    fs.writeFileSync(filePath, 'x');

    await parse(filePath);

    expect(parseSpreadsheet).toHaveBeenCalledWith(filePath);
  });

  test('parse should route .eml to parseEmail', async () => {
    const filePath = path.join(tempRoot, 'a.eml');
    fs.writeFileSync(filePath, 'x');

    await parse(filePath);

    expect(parseEmail).toHaveBeenCalledWith(filePath);
  });

  test('parse should fallback to parseText for unknown extension', async () => {
    const filePath = path.join(tempRoot, 'a.log');
    fs.writeFileSync(filePath, 'fallback', 'utf-8');

    const output = await parse(filePath);
    expect(output).toBe('fallback');
  });
});

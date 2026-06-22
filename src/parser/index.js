const fs = require('fs/promises');
const path = require('path');
const { parsePDF } = require('./pdf');
const { parseImage } = require('./image');
const { parseSpreadsheet } = require('./spreadsheet');
const { parseEmail } = require('./email');

async function parseText(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * 文档解析器 — 支持多种格式
 *
 * 支持的格式：
 *   .txt .md .json .yaml .yml .xml .html .csv .tsv  — 纯文本
 *   .pdf                                                — PDF（含 OCR）
 *   .jpg .jpeg .png .webp                              — 图片 OCR
 *   .xlsx .xls                                          — Excel 表格
 *   .eml                                                — 邮件
 *   .docx                                               — Word 文档（mammoth）
 *   .pptx                                               — PowerPoint（officeparser）
 *   .py .js .ts .go .rs .java .c .cpp .h .sh .sql      — 代码文件（按文本处理）
 */
async function parse(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    // 纯文本类
    case '.txt':
    case '.md':
    case '.markdown':
    case '.json':
    case '.yaml':
    case '.yml':
    case '.xml':
    case '.html':
    case '.htm':
    case '.log':
      return parseText(filePath);

    // 代码文件（按文本处理）
    case '.py':
    case '.js':
    case '.ts':
    case '.tsx':
    case '.jsx':
    case '.go':
    case '.rs':
    case '.java':
    case '.c':
    case '.cpp':
    case '.h':
    case '.hpp':
    case '.sh':
    case '.sql':
    case '.rb':
    case '.php':
    case '.vue':
      return parseText(filePath);

    // PDF
    case '.pdf':
      return parsePDF(filePath, options);

    // 图片 OCR
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.webp':
    case '.bmp':
    case '.gif':
      return parseImage(filePath, options);

    // 表格
    case '.xlsx':
    case '.xls':
    case '.csv':
    case '.tsv':
      return parseSpreadsheet(filePath);

    // 邮件
    case '.eml':
      return parseEmail(filePath);

    // Word
    case '.docx':
      return require('./word').parseWord(filePath);

    // PowerPoint
    case '.pptx':
      return require('./pptx').parsePptx(filePath);

    default:
      // 未知格式尝试按文本读取
      return parseText(filePath);
  }
}

module.exports = {
  parse,
  parseText
};

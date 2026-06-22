/**
 * Word 文档解析 (.docx)
 * 使用 mammoth 提取纯文本
 */

async function parseWord(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
}

module.exports = { parseWord };

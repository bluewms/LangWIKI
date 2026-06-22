/**
 * PowerPoint 解析 (.pptx)
 * 使用 officeparser 提取文本
 */

async function parsePptx(filePath) {
  const { parseOfficeAsync } = require('officeparser');
  const text = await parseOfficeAsync(filePath);
  return text || '';
}

module.exports = { parsePptx };

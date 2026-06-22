const fs = require('fs');
const pdfParse = require('pdf-parse');

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await pdfParse(buffer);
  return result.text || '';
}

module.exports = { parsePDF };
const fs = require('fs/promises');
const path = require('path');
const { parsePDF } = require('./pdf');
const { parseImage } = require('./image');
const { parseSpreadsheet } = require('./spreadsheet');
const { parseEmail } = require('./email');

async function parseText(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

async function parse(filePath, options = {}) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return parsePDF(filePath, options);
    case '.txt':
    case '.md':
      return parseText(filePath);
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.webp':
      return parseImage(filePath, options);
    case '.xlsx':
    case '.xls':
    case '.csv':
    case '.tsv':
      return parseSpreadsheet(filePath);
    case '.eml':
      return parseEmail(filePath);
    default:
      return parseText(filePath);
  }
}

module.exports = {
  parse,
  parseText
};
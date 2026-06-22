const Tesseract = require('tesseract.js');

async function parseImage(filePath, options = {}) {
  const lang = options.lang || 'chi_sim+eng';
  const result = await Tesseract.recognize(filePath, lang);
  return result?.data?.text || '';
}

module.exports = { parseImage };
const XLSX = require('xlsx');

async function parseSpreadsheet(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return '';

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
}

module.exports = { parseSpreadsheet };
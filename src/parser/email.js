const fs = require('fs');

function pickHeader(raw, key) {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'im');
  return raw.match(regex)?.[1]?.trim() || '';
}

async function parseEmail(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');

  const from = pickHeader(raw, 'From');
  const to = pickHeader(raw, 'To');
  const subject = pickHeader(raw, 'Subject');

  const body = raw.split(/\r?\n\r?\n/).slice(1).join('\n\n').trim();

  return [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, '', body]
    .join('\n')
    .trim();
}

module.exports = { parseEmail };
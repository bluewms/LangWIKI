const crypto = require('crypto');

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function computeEventFingerprint(event = {}) {
  const payload = {
    event_type: normalizeValue(event.event_type),
    party: normalizeValue(event.party),
    amount: normalizeValue(event.amount),
    currency: normalizeValue(event.currency || 'CNY'),
    event_date: normalizeValue(event.event_date),
    source_sha256: normalizeValue(event.source_sha256)
  };

  const stable = JSON.stringify(payload);
  return crypto.createHash('sha256').update(stable).digest('hex');
}

module.exports = {
  computeEventFingerprint
};
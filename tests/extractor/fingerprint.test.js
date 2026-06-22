const { computeEventFingerprint } = require('../../src/extractor/fingerprint');

describe('extractor/fingerprint', () => {
  test('same business event should produce same fingerprint regardless of extra fields', () => {
    const a = {
      event_type: '收款',
      party: '富士康',
      amount: 5000,
      currency: 'CNY',
      event_date: '2026-05-28',
      source_sha256: 'sha256:file1',
      note: 'A'
    };

    const b = {
      event_type: '收款',
      party: '富士康',
      amount: 5000,
      currency: 'CNY',
      event_date: '2026-05-28',
      source_sha256: 'sha256:file1',
      random: 'B'
    };

    expect(computeEventFingerprint(a)).toBe(computeEventFingerprint(b));
  });

  test('different business fields should produce different fingerprint', () => {
    const base = {
      event_type: '收款',
      party: '富士康',
      amount: 5000,
      currency: 'CNY',
      event_date: '2026-05-28',
      source_sha256: 'sha256:file1'
    };

    const changed = { ...base, amount: 5001 };

    expect(computeEventFingerprint(base)).not.toBe(computeEventFingerprint(changed));
  });
});

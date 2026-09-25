import assert from 'node:assert/strict';
import test from 'node:test';

import handler, {
  _resetFirestoreForTests,
  duplicateId,
  persistInquiry,
  validateInquiry,
} from '../api/inquiries.js';

const valid = {
  name: 'Aarav Sharma',
  email: 'AARAV@example.com',
  phone: '+91 98765 43210',
  date: '2027-02-14',
  location: 'Udaipur',
  service: 'weddings',
  message: 'We are planning a two-day wedding celebration.',
  consent: true,
  website: '',
};

function responseRecorder() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test('normalizes and accepts a valid inquiry', () => {
  const result = validateInquiry(valid);
  assert.equal(result.errors, undefined);
  assert.equal(result.value.email, 'aarav@example.com');
  assert.equal(result.value.consent, true);
});

test('rejects missing consent, invalid service, invalid date, and honeypot content', () => {
  const result = validateInquiry({
    ...valid,
    consent: false,
    service: 'events',
    date: '2027-02-30',
    website: 'https://spam.example',
  });
  assert.match(result.errors.join(' '), /consent/);
  assert.match(result.errors.join(' '), /service/);
  assert.match(result.errors.join(' '), /calendar date/);
  assert.match(result.errors.join(' '), /Spam check/);
});

test('duplicate fingerprint is stable after validation normalization', () => {
  const first = validateInquiry(valid).value;
  const second = validateInquiry({ ...valid, email: ' aarav@example.com ' }).value;
  assert.equal(duplicateId(first), duplicateId(second));
});

test('returns 503 instead of success when Firebase credentials are absent', async () => {
  const original = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  _resetFirestoreForTests();

  const response = responseRecorder();
  await handler({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: valid,
  }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.payload, {
    error: 'Inquiry service is temporarily unavailable. Please try again later.',
  });

  if (original === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = original;
});

test('rejects non-POST requests and advertises POST', async () => {
  const response = responseRecorder();
  await handler({ method: 'GET', headers: {} }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
});

function fakeFirestore(existingDedupe = null) {
  const writes = [];
  let generated = 0;
  return {
    writes,
    collection(name) {
      return {
        doc(id = `generated-${++generated}`) {
          return { collection: name, id };
        },
      };
    },
    async runTransaction(callback) {
      return callback({
        async get(ref) {
          if (ref.collection === '_inquiry_dedup' && existingDedupe) {
            return { exists: true, get: (field) => existingDedupe[field] };
          }
          return { exists: false, get: () => undefined };
        },
        set(ref, data) { writes.push({ ref, data }); },
      });
    },
  };
}

test('transaction stores an inquiry and its dedupe marker atomically', async () => {
  const inquiry = validateInquiry(valid).value;
  const db = fakeFirestore();
  const result = await persistInquiry(db, inquiry);

  assert.deepEqual(result, { duplicate: false });
  assert.equal(db.writes.length, 2);
  const inquiryWrite = db.writes.find((write) => write.ref.collection === 'inquiries');
  const dedupeWrite = db.writes.find((write) => write.ref.collection === '_inquiry_dedup');
  assert.equal(inquiryWrite.data.email, 'aarav@example.com');
  assert.equal(inquiryWrite.data.status, 'new');
  assert.equal(dedupeWrite.data.inquiryId, inquiryWrite.ref.id);
  assert.ok(inquiryWrite.data.createdAt instanceof Date);
});

test('transaction rejects a recent duplicate without writing', async () => {
  const inquiry = validateInquiry(valid).value;
  const db = fakeFirestore({ createdAt: { toMillis: () => Date.now() - 60_000 } });
  const result = await persistInquiry(db, inquiry);

  assert.deepEqual(result, { duplicate: true });
  assert.equal(db.writes.length, 0);
});

import crypto from 'node:crypto';

const MAX_BODY_BYTES = 16 * 1024;
const DUPLICATE_WINDOW_MS = 15 * 60 * 1000;
const SERVICES = new Set(['weddings', 'pre-weddings', 'films', 'portraits']);

let firestorePromise;

function sendJson(response, status, payload, headers = {}) {
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json(payload);
}

function text(value, field, { min = 0, max, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) return { error: `${field} is required.` };
    return { value: '' };
  }
  if (typeof value !== 'string') return { error: `${field} must be a string.` };

  const normalized = value.trim();
  if (required && normalized.length === 0) return { error: `${field} is required.` };
  if (normalized.length < min || normalized.length > max) {
    return { error: `${field} must be between ${min} and ${max} characters.` };
  }
  return { value: normalized };
}

function validateInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object.'] };
  }

  const fields = {
    name: text(body.name, 'name', { min: 2, max: 100, required: true }),
    email: text(body.email, 'email', { min: 3, max: 254, required: true }),
    phone: text(body.phone, 'phone', { max: 40 }),
    date: text(body.date, 'date', { max: 10 }),
    location: text(body.location, 'location', { min: 2, max: 200, required: true }),
    service: text(body.service, 'service', { min: 1, max: 30, required: true }),
    message: text(body.message, 'message', { min: 10, max: 3000, required: true }),
    website: text(body.website, 'website', { max: 500 }),
  };

  const errors = Object.values(fields).flatMap((result) => result.error ? [result.error] : []);
  if (errors.length) return { errors };

  const values = Object.fromEntries(Object.entries(fields).map(([key, result]) => [key, result.value]));
  values.email = values.email.toLowerCase();
  values.service = values.service.toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('email must be valid.');
  if (values.phone && !/^[0-9+()\- .]{7,40}$/.test(values.phone)) errors.push('phone must be valid.');
  if (values.date && !/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.push('date must use YYYY-MM-DD.');
  if (values.date) {
    const parsed = new Date(`${values.date}T00:00:00.000Z`);
    if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== values.date) {
      errors.push('date must be a real calendar date.');
    }
  }
  if (!SERVICES.has(values.service)) {
    errors.push(`service must be one of: ${[...SERVICES].join(', ')}.`);
  }
  if (body.consent !== true) errors.push('consent must be accepted.');
  if (values.website) errors.push('Spam check failed.');

  return errors.length ? { errors } : { value: { ...values, consent: true } };
}

async function getFirestore() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const error = new Error('Firebase credentials are not configured.');
    error.code = 'FIREBASE_UNAVAILABLE';
    throw error;
  }

  if (!firestorePromise) {
    firestorePromise = (async () => {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch {
        throw Object.assign(new Error('Firebase credentials are invalid.'), { code: 'FIREBASE_UNAVAILABLE' });
      }

      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw Object.assign(new Error('Firebase credentials are incomplete.'), { code: 'FIREBASE_UNAVAILABLE' });
      }

      try {
        const { cert, getApps, initializeApp } = await import('firebase-admin/app');
        const { getFirestore: createFirestore } = await import('firebase-admin/firestore');
        const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
        return createFirestore(app);
      } catch (error) {
        error.code = 'FIREBASE_UNAVAILABLE';
        throw error;
      }
    })();
  }

  try {
    return await firestorePromise;
  } catch (error) {
    firestorePromise = undefined;
    throw error;
  }
}

function duplicateId(inquiry) {
  const fingerprint = [
    inquiry.email,
    inquiry.phone.toLowerCase(),
    inquiry.date,
    inquiry.location.toLowerCase(),
    inquiry.service,
    inquiry.message.toLowerCase(),
  ].join('\n');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

async function persistInquiry(db, inquiry) {
  const dedupeRef = db.collection('_inquiry_dedup').doc(duplicateId(inquiry));
  const inquiryRef = db.collection('inquiries').doc();

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(dedupeRef);
    const lastCreatedAt = existing.exists ? existing.get('createdAt') : null;
    if (lastCreatedAt && Date.now() - lastCreatedAt.toMillis() < DUPLICATE_WINDOW_MS) {
      return { duplicate: true };
    }

    const now = new Date();
    transaction.set(inquiryRef, {
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone || null,
      requestedDate: inquiry.date || null,
      location: inquiry.location,
      service: inquiry.service,
      message: inquiry.message,
      consent: true,
      status: 'new',
      source: 'website',
      createdAt: now,
    });
    transaction.set(dedupeRef, { createdAt: now, inquiryId: inquiryRef.id });
    return { duplicate: false };
  });
}

async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const contentType = request.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return sendJson(response, 415, { error: 'Content-Type must be application/json.' });
  }

  const declaredLength = Number(request.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return sendJson(response, 413, { error: 'Request body is too large.' });
  }

  let body = request.body;
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      return sendJson(response, 413, { error: 'Request body is too large.' });
    }
    try {
      body = JSON.parse(body.toString());
    } catch {
      return sendJson(response, 400, { error: 'Request body contains invalid JSON.' });
    }
  } else {
    try {
      if (Buffer.byteLength(JSON.stringify(body ?? null)) > MAX_BODY_BYTES) {
        return sendJson(response, 413, { error: 'Request body is too large.' });
      }
    } catch {
      return sendJson(response, 400, { error: 'Request body must be valid JSON.' });
    }
  }

  const validation = validateInquiry(body);
  if (validation.errors) {
    return sendJson(response, 400, { error: 'Please correct the form.', details: validation.errors });
  }

  try {
    const db = await getFirestore();
    const result = await persistInquiry(db, validation.value);
    if (result.duplicate) {
      return sendJson(response, 429, { error: 'This inquiry was already received recently.' }, { 'Retry-After': '900' });
    }
    return sendJson(response, 201, { ok: true });
  } catch (error) {
    console.error('Inquiry persistence failed:', error && error.message ? error.message : 'Unknown error');
    return sendJson(response, 503, { error: 'Inquiry service is temporarily unavailable. Please try again later.' });
  }
}

export { duplicateId, persistInquiry, validateInquiry };
export function _resetFirestoreForTests() { firestorePromise = undefined; }
export default handler;

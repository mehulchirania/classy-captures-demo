import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const PROJECT_ID = 'classy-captures-demo-2026';
const ACCOUNT_ID = 'classy-inquiries';
const ACCOUNT_EMAIL = `${ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com`;
const ROLE = 'roles/datastore.user';
const ENV_PATH = path.resolve('.env.local');
const require = createRequire(import.meta.url);

function loadFirebaseAuth() {
  const npmRoot = execFileSync('npm', ['root', '-g'], {
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
  const auth = require(path.join(npmRoot, 'firebase-tools', 'lib', 'auth.js'));
  const scopes = require(path.join(npmRoot, 'firebase-tools', 'lib', 'scopes.js'));
  return { auth, scopes };
}

async function request(accessToken, url, { method = 'GET', body, accepted = [200] } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!accepted.includes(response.status)) {
    throw new Error(`Google API request failed with HTTP ${response.status}.`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function enableIamApi(accessToken) {
  const operation = await request(
    accessToken,
    `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/iam.googleapis.com:enable`,
    { method: 'POST', body: {}, accepted: [200] },
  );
  if (!operation?.name) return;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const status = await request(accessToken, `https://serviceusage.googleapis.com/v1/${operation.name}`);
    if (status.done) {
      if (status.error) throw new Error(`IAM API enablement failed with status ${status.error.code || 'unknown'}.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error('IAM API enablement did not finish within 60 seconds. Retry the setup.');
}

async function ensureServiceAccount(accessToken) {
  const accountUrl = `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${ACCOUNT_EMAIL}`;
  const existing = await fetch(accountUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (existing.status === 200) return;
  if (existing.status !== 404) throw new Error(`Service-account lookup failed with HTTP ${existing.status}.`);

  await request(accessToken, `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`, {
    method: 'POST',
    body: {
      accountId: ACCOUNT_ID,
      serviceAccount: {
        displayName: 'Classy Captures inquiry API',
        description: 'Vercel inquiry endpoint; Firestore data access only.',
      },
    },
    accepted: [200],
  });
}

async function ensureDatastoreRole(accessToken) {
  const policyUrl = `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}`;
  const policy = await request(accessToken, `${policyUrl}:getIamPolicy`, {
    method: 'POST',
    body: { options: { requestedPolicyVersion: 3 } },
  });
  const member = `serviceAccount:${ACCOUNT_EMAIL}`;
  const bindings = Array.isArray(policy.bindings) ? policy.bindings : [];
  let binding = bindings.find((item) => item.role === ROLE && !item.condition);
  if (binding?.members?.includes(member)) return;

  if (binding) binding.members = [...(binding.members || []), member];
  else bindings.push({ role: ROLE, members: [member] });

  await request(accessToken, `${policyUrl}:setIamPolicy`, {
    method: 'POST',
    body: {
      policy: {
        ...policy,
        bindings,
        version: policy.version || 3,
      },
      updateMask: 'bindings,etag',
    },
  });
}

async function assertEnvIsSafe() {
  try {
    const current = await readFile(ENV_PATH, 'utf8');
    if (/^FIREBASE_SERVICE_ACCOUNT_JSON=/m.test(current)) {
      throw new Error('.env.local already contains FIREBASE_SERVICE_ACCOUNT_JSON; no new key was created.');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function createKey(accessToken) {
  const result = await request(
    accessToken,
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${ACCOUNT_EMAIL}/keys`,
    {
      method: 'POST',
      body: {
        privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
        keyAlgorithm: 'KEY_ALG_RSA_2048',
      },
    },
  );
  if (!result?.name || !result.privateKeyData) throw new Error('Google API did not return a usable service-account key.');
  return result;
}

async function deleteKey(accessToken, keyName) {
  await request(accessToken, `https://iam.googleapis.com/v1/${keyName}`, {
    method: 'DELETE',
    accepted: [200, 204],
  });
}

async function main() {
  await assertEnvIsSafe();
  const { auth, scopes } = loadFirebaseAuth();
  const account = auth.getProjectDefaultAccount(process.cwd());
  if (!account?.tokens?.refresh_token) {
    throw new Error('No Firebase CLI login found. Run firebase login --reauth and retry.');
  }
  const tokens = await auth.getAccessToken(account.tokens.refresh_token, [scopes.CLOUD_PLATFORM]);
  const accessToken = tokens?.access_token;
  if (!accessToken) throw new Error('Firebase CLI could not provide an access token.');

  console.log('Enabling the IAM API…');
  await enableIamApi(accessToken);
  console.log('Ensuring the dedicated service account exists…');
  await ensureServiceAccount(accessToken);
  console.log('Ensuring the Firestore data role is present…');
  await ensureDatastoreRole(accessToken);
  console.log('Creating a service-account key…');
  const key = await createKey(accessToken);

  try {
    const decoded = Buffer.from(key.privateKeyData, 'base64').toString('utf8');
    const oneLineJson = JSON.stringify(JSON.parse(decoded));
    let prefix = '';
    try {
      const current = await readFile(ENV_PATH, 'utf8');
      if (current.length && !current.endsWith('\n')) prefix = '\n';
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await appendFile(ENV_PATH, `${prefix}FIREBASE_SERVICE_ACCOUNT_JSON=${oneLineJson}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
  } catch (error) {
    try {
      await deleteKey(accessToken, key.name);
    } catch {
      throw new Error('Writing .env.local failed and automatic key cleanup also failed; delete the newly created key in Google Cloud IAM.');
    }
    throw error;
  }

  console.log('Firebase server credentials were written to .env.local. No secret values were printed.');
}

main().catch((error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
});

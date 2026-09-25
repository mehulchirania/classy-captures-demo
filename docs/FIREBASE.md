# Firebase inquiry storage

The contact form sends `POST /api/inquiries` requests to a Vercel Node.js Function. The function validates the payload and writes it to the `inquiries` collection with the Firebase Admin SDK. Browser access to every Firestore document is denied by `firestore.rules`; Admin SDK calls from the server bypass those client security rules.

## Create and configure Firebase

1. Create or select a Firebase project and enable Cloud Firestore in the Firebase console.
2. In **Project settings → Service accounts**, generate a new private key. Treat the downloaded JSON as a secret; do not copy it into the repository or any client-side environment variable.
3. In Vercel, open the project and add `FIREBASE_SERVICE_ACCOUNT_JSON` under **Settings → Environment Variables**. Paste the entire downloaded JSON object as the value and enable it for each environment that should accept inquiries.
4. Install the server dependency at the project root:

   ```sh
   npm install firebase-admin
   ```

5. Deploy the Firestore rules from the project root after installing and authenticating the Firebase CLI:

   ```sh
   firebase use your-project-id
   firebase deploy --only firestore:rules
   ```

### Least-privilege service account helper

For the `classy-captures-demo-2026` project, `node scripts/setup-firebase.mjs` uses the current Firebase CLI login in memory to enable the IAM API, create or reuse `classy-inquiries@classy-captures-demo-2026.iam.gserviceaccount.com`, grant only `roles/datastore.user`, create a key, and append the one-line credential to the ignored `.env.local`. It preserves all existing project IAM bindings and never prints the access token or private key. If `.env.local` already has `FIREBASE_SERVICE_ACCOUNT_JSON`, it stops before creating another key.

The helper depends on Firebase CLI's internal auth module because the supported Google REST workflow normally obtains its access token from `gcloud`, which is not installed here. Run `firebase login --reauth` first if the CLI says the existing login lacks the `cloud-platform` scope. After setup, add the value to Vercel as a sensitive environment variable and keep `.env.local` private.

For local development, copy `.env.example` to the local environment file used by the app and replace the placeholder with the one-line service-account JSON. Keep the real file out of version control. If the environment variable is absent, malformed, or Firebase cannot be reached, the endpoint returns HTTP 503 and does not report a successful submission.

## Endpoint contract

Send `Content-Type: application/json` with this shape:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "phone": "+91 98765 43210",
  "date": "2027-02-14",
  "location": "Udaipur",
  "service": "weddings",
  "message": "We are planning a two-day wedding celebration.",
  "consent": true,
  "website": ""
}
```

`phone` and `date` are optional. `service` must be `weddings`, `pre-weddings`, `films`, or `portraits`. `website` is a honeypot and must stay empty. The request body is capped at 16 KiB. Exact duplicate inquiries are rejected for 15 minutes with HTTP 429. Valid submissions receive HTTP 201; validation failures receive HTTP 400.

The server stores contact details, the requested date, service, message, consent, status, source, and creation time. It does not send email. Review inquiries through the authenticated Firebase console or a separate trusted Admin SDK tool.

Official references: [Firebase Admin setup](https://firebase.google.com/docs/admin/setup), [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started), and [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js).

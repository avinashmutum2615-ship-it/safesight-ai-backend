# SafeSight application setup

This update connects the clinic website to the AI backend and adds staff and clinical screens. It has not been deployed to your existing public website.

## 1. Folder layout

Keep both repositories next to each other:

```
safesight-ai-backend/
safesight-website/
```

Use Node.js 22 or newer. MongoDB must be a replica set (MongoDB Atlas supports the transactions used by staff creation and visit transitions).

## 2. Configure the backend

From `safesight-ai-backend`, run:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` locally:

- `MONGODB_URI`: your Atlas connection string, or the local replica-set URI already shown in the example.
- `JWT_SECRET`: a random secret of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`: your first administrator account. Use a password of at least 12 characters.
- `FRONTEND_DIR=../safesight-website` lets the backend serve both the website and API on one origin.
- `GOOGLE_API_KEY`: optional for AI. Booking and staff operations work without it.

Do not commit `.env` or paste credentials into chat.

For local MongoDB with Docker Desktop:

```powershell
docker compose up -d
```

Wait for the replica set to initialize. Alternatively, use an Atlas database and its connection string. Do not expose the local, unauthenticated Docker database publicly.

## 3. Create the first account and start

```powershell
npm run seed-admin
npm start
```

Open `http://localhost:3000/` for the clinic website or `http://localhost:3000/login.html` for staff login.

Sign in as the administrator. Open **Staff accounts** and create a doctor and a receptionist. A doctor must exist before patients can select a doctor in the booking form. Doctors can change their working hours, working days, breaks and availability in **My availability**.

Optional clinic metadata: set `CLINIC_PHONE`, `CLINIC_EMAIL`, and `CLINIC_ADDRESS`, then run `npm run seed-clinic`. This preserves any existing clinic settings. Review the clinic's existing public pages and medical content before publishing.

## 4. Use the clinical workflow

1. Patient opens `Appointment.html`, selects an available doctor, date and slot, and submits a request.
2. Reception or admin confirms the request in **Appointments → Open**.
3. Reception or admin checks in the patient.
4. The assigned doctor opens **Consultations → Open visit → Start consultation**.
5. The doctor saves examination findings and a prescription. The saved prescription can be printed.
6. The doctor completes the visit. The appointment is also marked completed.

Appointment times use India Standard Time. Requests are saved as **Pending Confirmation**; no SMS, email or telephone confirmation is automatically sent. Public cancellation and rescheduling require contacting staff; name and phone alone do not authorize record changes.

## 5. Validation

Backend:

```powershell
npm test
npm run test:integration
```

The integration suite starts a disposable MongoDB replica set. If downloading/running its binary is unavailable, set `TEST_MONGODB_URI` to a test-capable replica set. The suite creates and drops its own uniquely named test database. It does not use your application's normal database name.

Frontend:

```powershell
cd ../safesight-website
npm ci
npm test
```

Verified in this implementation session: 16 backend unit/HTTP checks, 3 real MongoDB integration tests (including the clinical workflow and simultaneous booking conflict), and 4 frontend DOM interaction tests. Frontend tests use API fixtures. Browser rendering and live deployment still need verification; the local browser process was unavailable in the editing environment.

## 6. Separate frontend and backend hosting

- Backend: Node service, build `npm ci --omit=dev`, start `npm start`.
- Set the backend environment variables securely in the hosting provider. Omit `FRONTEND_DIR` if hosting the website separately.
- Set `window.SAFESIGHT_API_BASE` in the website's `config.js` to the deployed backend's HTTPS origin, without `/api`.
- Set backend `CORS_ORIGINS` to the exact frontend origin(s), comma separated.
- Deploy the static website directory. No frontend build is required.
- Set `TRUST_PROXY=1` only when the service is behind exactly one trusted reverse proxy, so request limits use the correct client address.
- Verify `/api/health`, then test booking, staff login and the full clinical workflow on the hosted services.

Existing duplicate active appointments in the same doctor/date/time slot must be resolved before the new unique index can be created. Startup intentionally fails if that index cannot be created; do not remove the index to hide conflicting bookings.

## 7. AI and knowledge retrieval

Set `GOOGLE_API_KEY` to enable the existing Gemini integration. Public chat has informational tools only; patient booking uses the validated form. Staff chat uses role-specific tools. Conversations are scoped to signed conversation tokens and authenticated staff identities.

For RAG, the existing knowledge files are under `src/ai/knowledge`. The ingestion entry point has been fixed:

```powershell
npm run ingest-knowledge
```

Atlas needs a vector-search index named `vector_index` over the `knowledge` collection's `embedding` field. Match the index dimensions to the vectors produced by your configured embedding model. The code uses `gemini-embedding-001`; live model access, quota, embeddings and retrieval have **not** been tested with your account. Review knowledge content before use; AI output is not a substitute for a clinician.

## Remaining before a production launch

- Publish these changes to both GitHub repositories and deploy the services.
- Configure real database and AI credentials, verified clinic details, and staff accounts.
- Verify desktop/mobile rendering and the hosted workflow with test records.
- Verify live Gemini and Atlas vector retrieval.
- Set backup/restore procedures, monitoring, audit logging, retention and account/password recovery appropriate to the clinic.
- Chat memory is currently in-process; conversations are lost on restart and are not shared across server instances. Rate limits are also in-process.

This is a tested core clinic workflow, not a certification of production readiness or clinical accuracy.

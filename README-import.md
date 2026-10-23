# SmartTap business import

The existing GitHub Pages site is a compiled static MVP. This addition keeps that creator and its v1 public profile URLs, adds `setup.html` for business search/import, and supports an optional logo on public profiles. It does not add accounts, analytics, a database or editable permanent profile URLs.

## Data flow

1. The user enters a business name and optional city. After 3 characters and a 600 ms typing pause, Google Places Autocomplete (New) suggests businesses by name/address. Arrow keys, Enter, mouse and touch can select a result; the full-search button remains available. Outdated requests are cancelled/ignored and repeated queries are cached only within the current session. A selection uses the same session token for Place Details and starts a fresh token for the next search.
2. A private server credential calls Places Text Search (New) and Place Details (New). Only the selected Place ID is used to derive the direct review URL.
3. The server reads the public HTTPS website listed for that business. Legacy HTTP website links are upgraded to HTTPS. It extracts Organization/LocalBusiness structured data, explicitly marked header logos, metadata descriptions and actual social profile links. It does not invent usernames or label a generic storefront photo as a logo. Multiple social accounts require a user choice.
4. The user can edit every field. Publishing encodes the confirmed profile in a v1 URL; QR generation must succeed before output is displayed. Existing static public URLs still work. A changed profile requires a new URL/QR and NFC reprogramming.

Google search results are transient and attributed. The service does not copy Google editorial summaries or photo URLs into long-lived profile URLs. Name defaults to the user's query unless the official site supplies its own name. Place IDs and derived review links persist in the output.

## Local verification

Node 22 or later:

```
npm ci
npm test
npm run build
```

For a clearly labelled, localhost-only fixture preview, set `PREVIEW_DEMO=1` then run `npm run preview`. Open `http://127.0.0.1:8787/setup.html`. Demo results are not Google results. A normal production start ignores PREVIEW_DEMO and fails closed without real credentials.

## Deployment

Frontend hosting: `askmenoob/tap-imai-site`, GitHub Pages custom domain `tap.imai.my`. Static release files are `index.html`, `business-entry.js`, `setup.html`, `business-import.js`, `business-import.css`, `import-config.js`, `privacy.html`, `terms.html`; existing assets and CNAME stay in place. Source is also provided in the accompanying source archive.

Backend: Cloud Run `tap-business-import`, project `cedar-kiln-502614-h5` (project name PROJECT), region `asia-southeast1`.
Endpoint: `https://tap-business-import-262870839474.asia-southeast1.run.app`.

Dedicated runtime identity: `tap-business-import@cedar-kiln-502614-h5.iam.gserviceaccount.com`. It can read only the two named Secret Manager secrets needed by this service. Dedicated builder identity has the Cloud Run Builder role.

Required environment: `GOOGLE_PLACES_API_KEY` (Places-only API key, stored in `tap-import-places-key`), `IMPORT_SIGNING_SECRET` (at least 32 characters, stored in `tap-import-signing-key`), `ALLOWED_ORIGINS=https://tap.imai.my`, `MAX_DAILY_REQUESTS=300`.
No secret value belongs in GitHub, HTML or import-config.js. Secret versions are pinned at deployment. The initial temporary key was revoked; the active key is `tap-imai-import-server-v2`, using secret version 2.

Cloud Run uses zero minimum instances and a maximum of one, 256 MiB memory, one CPU, concurrency 10, request timeout 60 seconds. Origin checks, signed expiring selections, request size limits, 12 full-search/import requests per minute, 30 suggestion requests per minute, and a shared 300 requests/day per running process reduce abuse. These counters reset when the process restarts and are not a billing cap. Cloud Run and Places usage can incur Google charges. The pre-existing US$10 project budget is an alert, not a spending limit.

## Safety and operational limits

The importer accepts no arbitrary target URL from callers: websites come from the selected Google Place. Every outbound DNS result must be public. Connections use a pinned validated address; HTTPS redirects are revalidated. Local/metadata/private targets, credentials, nonstandard ports and unsafe schemes are rejected. HTML is limited to 1 MiB and each network request has a timeout. No source HTML or remote JavaScript is executed in the browser.

Only the public homepage and its server-rendered metadata are read. A business without a website, a social-only page, a JavaScript-only site or an anti-bot block may provide only a review link and partial fields. Missing data stays blank with a visible explanation; users can edit it manually. No claim is made that every business has a discoverable logo or every social profile.

Firebase Hosting remains disabled. This feature uses GitHub Pages plus Cloud Run and does not reactivate Firebase Hosting.

## Google web profiles and phone links

Approved Google Search enrichment uses Vertex AI `gemini-3.8-flash` with Google Search grounding and the Cloud Run runtime identity. The dedicated custom IAM role only grants `aiplatform.endpoints.predict`; no model API key is exposed to the frontend. Enable with `GOOGLE_SEARCH_ENABLED=true`, `GOOGLE_SEARCH_PROJECT=cedar-kiln-502614-h5`, `GOOGLE_SEARCH_MODEL=gemini-3.8-flash`. Google Search/model usage can incur charges. Results are cached per Place ID for 3 minutes within an instance; this is not a hard billing cap.

Social profile suggestions must match the business handle and be supported by Google source citations. Search suggestion HTML is displayed in a sandboxed iframe. Profiles that cannot be matched are left blank; reviewers are excluded. Available platforms: Instagram, Facebook, TikTok, Threads. All fields remain editable. Search is not a guarantee of account ownership or discovery of every platform.

Place Details also returns the selected branch phone. Malaysian formats such as `012-2258950`, `+60 12-225 8950` and `0060122258950` normalize to `60122258950`. If no explicit WhatsApp URL exists on the official site, the service generates `https://wa.me/60122258950` with a verification warning. This conversion does not check WhatsApp registration. Editing the phone updates the WhatsApp URL; the user can edit that URL separately. The public page supports Threads while preserving existing v1 profile links.

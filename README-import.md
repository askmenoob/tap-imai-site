# SmartTap business import

SmartTap is a static frontend backed by the existing Cloud Run service and private Cloud Storage records. It supports business search/import, stable first-party short URLs and QR codes, super-admin management, registered Gmail owner editing, and manually verified annual QR subscriptions. Public encoded-profile URLs no longer render directly.

## Data flow

1. The user enters a business name and optional city. After 3 characters and a 600 ms typing pause, Google Places Autocomplete (New) suggests businesses by name/address. Arrow keys, Enter, mouse and touch can select a result; the full-search button remains available. Outdated requests are cancelled/ignored and repeated queries are cached only within the current session. A selection uses the same session token for Place Details and starts a fresh token for the next search.
2. A private server credential calls Places Text Search (New) and Place Details (New). Only the selected Place ID is used to derive the direct review URL.
3. The server reads the public HTTPS website listed for that business. Legacy HTTP website links are upgraded to HTTPS. It extracts Organization/LocalBusiness structured data, explicitly marked header logos, metadata descriptions and actual social profile links. It does not invent usernames or label a generic storefront photo as a logo. Multiple social accounts require a user choice.
4. The user can edit every field. Publishing stores an internal v1 profile mapping and returns only a short URL; storage and QR generation must both succeed before output is displayed. Existing static public URLs still work. A changed profile requires a new URL/QR and NFC reprogramming.

Google search results are transient and attributed. The service does not copy Google editorial summaries or photo URLs into long-lived profile URLs. Name comes from the selected Google business; an official site title does not replace the chosen branch name. Place IDs and derived review links persist in the output.

## Local verification

Node 22 or later:

```
npm ci
npm test
npm run build
```

For a clearly labelled, localhost-only fixture preview, set `PREVIEW_DEMO=1` then run `npm run preview`. Open `http://127.0.0.1:8787/setup.html`. Demo results are not Google results. A normal production start ignores PREVIEW_DEMO and fails closed without real credentials.

## Deployment

Frontend hosting: Cloudflare Pages Free project `tap-imai-site`, custom domain `tap.imai.my`, with source in `askmenoob/tap-imai-site`. The Pages build command is `npm run build && node scripts/prepare-pages.mjs`; output directory is `dist`. The preparation script allows exactly 27 public release files, including `/subscribe/`, `/edit/`, the admin page and existing assets. Backend source, environment files and the old GitHub Pages CNAME file are excluded from the published directory. The main branch remains the canonical source after the launch branch is merged.

The approved 23 October 2026 launch activated the custom domain with SSL, verified authoritative and public DNS, and enabled PAYMENTS_ENABLED=true on Cloud Run revision tap-business-import-00014-qrq. Cloudflare automatic production deployments follow main. Payment activation is a manual bank-receipt workflow; deployment verification does not represent a real bank transfer or payment approval.

Backend: Cloud Run `tap-business-import`, project `cedar-kiln-502614-h5` (project name PROJECT), region `asia-southeast1`.
Endpoint: `https://tap-business-import-262870839474.asia-southeast1.run.app`.

Dedicated runtime identity: `tap-business-import@cedar-kiln-502614-h5.iam.gserviceaccount.com`. Its secret access is limited to the two named Secret Manager secrets needed by this service. Model calls and short-link storage use the separately documented restricted roles. Dedicated builder identity has the Cloud Run Builder role.

Required environment: `GOOGLE_PLACES_API_KEY` (Places-only API key, stored in `tap-import-places-key`), `IMPORT_SIGNING_SECRET` (at least 32 characters, stored in `tap-import-signing-key`), `ALLOWED_ORIGINS=https://tap.imai.my`, `MAX_DAILY_REQUESTS=300`.
No secret value belongs in GitHub, HTML or import-config.js. Secret versions are pinned at deployment. The initial temporary key was revoked; the active key is `tap-imai-import-server-v2`, using secret version 2.

Cloud Run uses zero minimum instances and a maximum of one, 256 MiB memory, one CPU, concurrency 10, request timeout 60 seconds. Origin checks, signed expiring selections, request size limits, 12 full-search/import requests per minute, 30 suggestion requests per minute, and a shared 300 requests/day per running process reduce abuse. These counters reset when the process restarts and are not a billing cap. Cloud Run and Places usage can incur Google charges. The pre-existing US$10 project budget is an alert, not a spending limit.

## Safety and operational limits

The importer accepts no arbitrary target URL from callers: websites come from the selected Google Place. Every outbound DNS result must be public. Connections use a pinned validated address; HTTPS redirects are revalidated. Local/metadata/private targets, credentials, nonstandard ports and unsafe schemes are rejected. HTML is limited to 1 MiB and each network request has a timeout. No source HTML or remote JavaScript is executed in the browser.

Only the public homepage and its server-rendered metadata are read. A business without a website, a social-only page, a JavaScript-only site or an anti-bot block may provide only a review link and partial fields. Missing data stays blank with a visible explanation; users can edit it manually. No claim is made that every business has a discoverable logo or every social profile.

Firebase Hosting remains disabled. This feature uses Cloudflare Pages plus the existing Cloud Run backend and does not reactivate Firebase Hosting.

## Google web profiles and phone links

Approved Google Search enrichment uses Vertex AI `gemini-3.8-flash` with Google Search grounding and the Cloud Run runtime identity. The dedicated custom IAM role only grants `aiplatform.endpoints.predict`; no model API key is exposed to the frontend. Enable with `GOOGLE_SEARCH_ENABLED=true`, `GOOGLE_SEARCH_PROJECT=cedar-kiln-502614-h5`, `GOOGLE_SEARCH_MODEL=gemini-3.8-flash`. Google Search/model usage can incur charges. Results are cached per Place ID for 3 minutes within an instance; this is not a hard billing cap.

Social profile suggestions must match the business handle and be supported by Google source citations. Search suggestion HTML is displayed in a sandboxed iframe. Profiles that cannot be matched are left blank; reviewers are excluded. Available platforms: Instagram, Facebook, TikTok, Threads. All fields remain editable. Search is not a guarantee of account ownership or discovery of every platform.

Place Details also returns the selected branch phone. Malaysian formats such as `012-2258950`, `+60 12-225 8950` and `0060122258950` normalize to `60122258950`. If no explicit WhatsApp URL exists on the official site, the service generates `https://wa.me/60122258950` with a verification warning. This conversion does not check WhatsApp registration. Editing the phone updates the WhatsApp URL; the user can edit that URL separately. The public page supports Threads while preserving existing v1 profile links.

## Short URLs only

The generate button always creates `https://tap.imai.my/?s=<16-character-id>` before generating any QR. Only that URL is shown, copied, opened and encoded in the downloaded QR. There is no original-URL toggle or fallback to a dense QR if storage fails. Failed generation leaves the result hidden and lets the user retry. Changing a profile creates a new destination; previously printed links are not retargeted. The public renderer reads the stored profile without navigating to its encoded URL, so the browser address stays short. The homepage routes creators to setup.html. Manual creation is disabled, including the old setup.html?manual=1 URL; the editor opens only after importing a selected business. Imported details and existing owner/admin pages remain editable.

`POST /api/shorten` accepts only a validated v1 SmartTap profile URL on the exact `https://tap.imai.my/` origin, with a required Google Review URL. It cannot shorten arbitrary external websites or nested short URLs. The existing creation request limits apply. `GET /api/links/<id>` returns the saved original URL to the public resolver; profile URLs and short URLs are public to anyone receiving the link. Public resolution does not consume the creator's daily request allowance.

Storage is `gs://cedar-kiln-502614-h5-tap-links` in `asia-southeast1`, configured through `SHORT_LINK_BUCKET`. Uniform bucket access and public-access prevention are enforced. Conditional object creation (`ifGenerationMatch=0`) prevents public creation from replacing an existing mapping. Public resolution reads the durable object on every request so a separate admin instance's changes appear on the next page load. Cloud Storage and resolution requests can incur charges. Firebase Hosting remains disabled.

IDs use a 96-bit HMAC-derived opaque value. Repeated generation of an identical original URL reuses its mapping, including simultaneous requests. A process restart or future signing-secret rotation does not invalidate saved mappings. IDs and records are not automatically removed when a subscription expires; public resolution is gated by page lifecycle and annual entitlement as described below. Removing the bucket or its objects would break the corresponding short links. No storage access key is sent to the browser.

The localhost demo uses an explicitly labelled in-memory mapping solely for UI verification. Production fails with a visible error and displays no URL or QR if durable storage has not been configured. To test resolution independently after a restart, create a production mapping, start a new Cloud Run revision, and resolve the same ID again.

## Super admin

`/admin.html` uses Google Identity Services with a dedicated web OAuth client whose only authorized JavaScript origin is `https://tap.imai.my`. Backend environment variables `ADMIN_GOOGLE_CLIENT_ID` and `ADMIN_EMAILS` configure the exact audience and verified-email allowlist. Only basic Google identity is used; no Gmail, Drive or Maps access is requested by this login. Only basic identity scopes are requested. Google exempts Sign in with Google from the Testing test-user allowlist requirement; Production status is not a prerequisite for registered customer login. Server-side ownership registration controls all page access. Login pages use the Google-recommended strict-origin-when-cross-origin referrer policy so GIS can validate the site origin. Missing configuration fails closed.

The browser keeps its ID token only in memory and sends it as an HTTPS Bearer header. Every protected request checks Google's RS256 signature using the rotating Google JWK set, issuer, client audience, expiry, issued time, subject, verified email and exact allowlist. All write requests also require an approved Origin and JSON content type; the admin API has no cookie authentication. Login tokens and actor emails are not returned by the public resolver. The dashboard clears local session data on logout and token expiry. Demo login is possible only when BOTH `--preview` and `PREVIEW_DEMO=1` are set, and that server binds to localhost.

Routes: public `GET /api/admin/config` (client ID only); protected `GET /api/admin/self`, `GET /api/admin/links?cursor=...`, `PUT /api/admin/links/<id>` with `{profile,revision}`. Listing is paginated at 25 items and includes all legacy records under `links/`. The UI exposes the loaded count and next-page control; filtering covers loaded records. Page lifecycle and manual annual renewal endpoints are documented below.

An admin save validates the same v1 profile contract, normalizes Malaysian phone numbers, and preserves the existing short ID. It first archives the previous record to `history/<id>/<generation>.json` using create-only storage, then replaces the mapping with `ifGenerationMatch=<generation>`. Stale edits return 409, never silently overwriting a newer save. Before-edit snapshots and actor metadata are private. Recovery currently requires an authorized storage operator; there is no restore UI yet. Public generation still uses create-only writes and cannot retarget an existing ID. Public resolution intentionally has no process cache after this change.

The existing bucket-only role `smarttapShortLinkStore` now has `storage.objects.create/get/list/delete`: GCS requires delete permission for a conditional overwrite. Only the existing runtime identity holds this custom bucket role; the bucket is not public. No API supports arbitrary object keys or object deletion. Seven-day bucket soft delete complements the permanent before-edit snapshots. Do not remove the bucket or its records.

Manual payment collection is controlled by PAYMENTS_ENABLED. Enable it only after the approved Cloudflare Pages launch has passed custom-domain HTTPS and live frontend checks. Approved packages and annual expiry behavior are documented below. GitHub remains the source repository; the approved migration changes only the tap.imai.my DNS record from askmenoob.github.io to tap-imai-site.pages.dev. Existing Cloud Run, storage, OAuth and unrelated domains remain in place. The previous DNS target is retained in the local migration record for rollback.


## Registered Gmail customer editing

`/edit` redirects to the static `/edit/` customer login page. Google Identity Services offers One Tap where the browser permits it, plus a standard Google sign-in button. After verified login, a sole owned page opens automatically; multiple owned pages can be selected. Tokens stay in memory and expire with the Google session.

Super admin uses `setup.html?register=1` to register a new business and its primary `@gmail.com` address together. Existing pages can be assigned or reassigned in `/admin.html`; this preserves the printed short URL and QR. Legacy records remain unassigned until the admin chooses their real owner. There is no self-registration or client-side ownership claim. Only the configured admin allowlist can register ownership.

Protected admin endpoints: `POST /api/admin/register` with `{url,email}`, `GET /api/admin/links/<id>`, and `PUT /api/admin/links/<id>/owner` with `{email,revision}`. Protected customer endpoints: `GET /api/user/self`, `GET /api/user/links?cursor=...`, `GET /api/user/links/<id>`, `PUT /api/user/links/<id>` with `{profile,revision}`. `/api/user/config` exposes only public OAuth configuration. Customers cannot call admin endpoints or set owner, role or email in updates. Unknown or foreign page IDs return a generic 404.

The private primary record stores `ownerEmail` and registration metadata outside the public profile. Gmail dot aliases resolve to the same ownership identity; plus aliases and non-Gmail addresses are rejected. Private `owners/<sha256-canonical-Gmail>/<id>.json` entries enable bounded 25-item owner listing. They are discoverability only: every list, read and write rechecks ownership in the current primary record. Membership is written before the conditional primary assignment. Stale membership entries are retained to avoid concurrent reassignment cleanup races, but confer no access. Conditional edits prevent an old owner from overwriting an admin reassignment. Public resolution returns only the public profile URL, never ownership or audit metadata.

Verification includes signed RS256 HTTP integration for two distinct Gmail identities, known foreign-ID read/write denial, role spoofing, unregistered Gmail, admin-only assignment, bad origins, non-Gmail identity, stale writes, assignment races and private GCS membership pagination. The explicitly enabled localhost demo has fixed sample identities and cannot run in production mode.


## Page lifecycle, product packages and manual DuitNow payments

Super admin can disable pages, soft delete them with exact business-name confirmation, restore deleted records as disabled, and then enable them. Customer and public APIs enforce lifecycle and annual expiry server-side on every read/write. Customer listing excludes soft-deleted pages. Before-change archives and conditional generation writes remain mandatory. Legacy pages remain active until a paid package is recorded; no existing customer is automatically charged or expired by deployment. New records have a pending annual subscription when payments are enabled. Direct public encoded-profile URLs no longer render; stored profiles are resolved only through stable short IDs.

Approved product prices: first Google Review NFC + one-year QR page RM100; one-time direct Google Review NFC RM70; annual QR renewal RM30; additional NFC RM30/unit; table sticker RM20/unit for 1-19, RM15/unit for all units at quantities of 20 or more. Shipping and its charges are arranged separately. The /subscribe/ page presents these packages, a quantity calculator, the owner-supplied sticker example and a login link retaining the chosen cart. All final quotes are recomputed on the server with integer MYR cents.

PAYMENTS_ENABLED defaults false. Enable only after commercial hosting has been approved and deployed. Local explicitly labelled demo enables payment simulation. The original owner-supplied DuitNow payload is preserved in payment-qr.mjs; JPEG decode and CRC validation were performed without initiating a payment. No bank API, card collection or automatic transfer is implemented. Customer bank references remain private. A request stays pending until an authenticated super admin explicitly confirms actual bank receipt. Approval is idempotent, uses a unique private payment-reference claim and a conditional primary-record update. Rejected or conflicting requests never grant an entitlement. Failed compare-and-swap after a reference claim can be retried for the same page/request; claims are never automatically reassigned to another order.

An approved bundle or renewal grants exactly 12 calendar months, preserving remaining time for early renewals and clamping leap-day anniversaries. An approved NFC-only order does not unlock a hosted QR page. Add-on orders preserve an existing annual expiry. Paying a manually disabled page does not enable it automatically. Physical NFC programming and dispatch remain manual operations.

Account endpoints add protected GET /api/{admin,user}/plan; POST /api/{admin,user}/links/:id/quote and /renewal; admin-only POST /api/admin/links/:id/state and /decision. Customer identity is checked against current private ownership on each request. Server quotes and request body limits reject price and role tampering. GCS payments/<sha256(date|normalized-reference)>.json entries prevent the same bank reference/date being approved for multiple requests; each claim contains only private operator audit metadata.

## Installable SmartTap app (PWA)

The shared manifest provides a stable root app identity, standalone display, a creator start page, customer/admin/package shortcuts and generated 192/512 PNG icons using the existing diamond brand. An additional 180 PNG is used for Apple home screens. Setup, customer editing, admin, packages and public entry pages link the same manifest. The install button uses the browser install prompt when available and otherwise shows Android Chrome and iPhone Safari instructions. It disappears after installation or in standalone mode.

The root service worker caches only a generic offline document and app icons. Same-origin HTML navigations always use the network and fall back to the generic document only on a network failure. API requests, Google login, writes, business data and account/subscription pages are never added to Cache Storage. HTTP denials remain denials. Offline use cannot verify subscriptions or save changes. Updates activate without forcing a reload or interrupting a form. Worker registration bypasses browser HTTP caching for update checks; the worker response also requests no-store caching. Real installation on a physical phone is a separate device check.

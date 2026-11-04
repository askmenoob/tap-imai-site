# SMARTTAP checkpoint — 5 November 2026 (Asia/Kuala_Lumpur)

TASK: Actual Concept B / Connected Hub visual redesign.
BRANCH: codex/smarttap-connected-hub-20261105
BASE SHA: 8b5d630cd049f7e562923c6bce0ff696cc6c491c
ROLLBACK DEPLOYMENT: 3e86008d-2ab2-4510-9e10-289656ed750f
HOST: existing Cloudflare Pages project tap-imai-site, production branch main.
BACKEND: existing tap-business-import Cloud Run; no backend deployment or writes.
FIREBASE: not used by the current serving repo; Firebase Hosting remains disabled.

CHANGED: assets/signature-hub.css; HTML stylesheet/skip-link/metadata integration;
src/customer-area.mjs SVG navigation; language-catalog.mjs skip-link translation;
scripts/prepare-pages.mjs public allowlist; app-icon surface, manifest, SW version;
generated business-admin.js; design standard and TODO.

EVIDENCE: npm ci (audit 0 vulnerabilities), npm run build, prepare-pages (53 public
files), npm test 159 passed / 0 failed / 0 skipped. Local Chrome via Playwright:
1440x1000, 390x844, 360x844 route sweep; no horizontal overflow or page errors.
Owner login, navigation, tabs, save with stable QR URL, mobile drawer, sharing,
business details, search/import, package calculation and admin listing verified
against localhost demo only. QA fixture records live only in local process memory.
Automated axe WCAG 2 A/AA + 2.1 AA: zero violations across six core routes after
fixing pricing caption contrast. Not a full manual WCAG conformance certification.
No configured lint/typecheck in this vanilla-JS repo; syntax checks used instead.

DEPLOY: pending preview and production verification. Do not rerun a deployment
blindly after timeout; inspect Cloudflare deployment and git SHA first.
BLOCKERS/LIMITS: exact reference mockup/full prompt unavailable in chat export;
Google-authenticated production account flows require a real account session;
no production payment, order, owner record or subscription was created/modified.
24h trial exists on separate unmerged work, not activated by this release.


## Release verified — 5 November 2026, 02:18 MYT

STATUS: IMPLEMENTED, MERGED AND LIVE. PR https://github.com/askmenoob/tap-imai-site/pull/42
UI HEAD SHA: a7a4a81b8c5264a5a3b2943d4624714039e708ec
PRODUCTION MERGE SHA: a93a4e823c973c8f6c49e712ca55142de78f926f
VERIFIED PRODUCTION DEPLOYMENT: 69408af8-9a8e-4a03-8e15-373b5aa6d9fd
FINAL PREVIEW: b3f5b025-ddfa-482d-841d-76f81e1fdf0c (success)
LIVE: https://tap.imai.my ; owner /edit/ ; public demo /demo/salon/

Both final preview and custom-domain production passed 15 smoke checks each:
seven routes at desktop/mobile plus backend health. All returned HTTP 200,
loaded signature CSS, rendered meaningful content, had no horizontal overflow
or uncaught page errors. BM/English switching, price estimator and demo dialog
interactions passed. Cloudflare deployment log: asset validation/upload and
publication succeeded. Backend health: ready=true, demo=false, shortLinks=true.
No authenticated production writes, purchase or live payment were performed.
Local functional suite passed again after final CSS change; its second run
required selecting the fixture in the existing multi-page picker before editing.
Axe repeated with final CSS: six routes, zero automated WCAG violations.
Five operations tests also pass; JavaScript/CSS syntax and diff checks pass.

Browser plugin unavailable: Chrome via regular Playwright used. Screenshots and
QA scripts kept outside the repository. Palette, desktop rail, mobile drawer,
typography, identity, public branding/media and unchanged visible workflow copy
were visually inspected. Exact mockup dimensions/pixel comparison unavailable.
Cloud Run production logs/account write flows are not verified by this release.
The 24h trial release remains separate and undeployed; no trial flag was changed.

This documentation-only follow-up records the verified UI release above. It
may trigger the same existing Pages build; inspect canonical deployment before
any retry. No migrations, seeds, backend release or infrastructure changes.

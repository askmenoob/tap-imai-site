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

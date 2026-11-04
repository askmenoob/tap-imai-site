# SMARTTAP — Botanical A checkpoint, 5 November 2026

CURRENT TASK: Correct the redesign against the user-supplied A reference.
USER CHOICE: A — Botanical Premium Tech. User approved release: “Terbitkan A”.
BRANCH: codex/smarttap-botanical-a-20261105
BASE / ROLLBACK SHA: 54a38c5d03035636131d566a2248a2c2f2ad97cf
PRODUCTION ROLLBACK: Cloudflare d24d47d9-2ad5-45ff-a60a-f444296370a8
PRODUCTION STATUS: LIVE — UI merge 9713169cb6217c23b43fc903af47a7f3e8d1a925.

IMPLEMENTED: Real owner home using src/customer-home.mjs, integrated into the
existing customer-area.mjs lifecycle. Actual premise picker, package state/date,
profile preview, existing QR/editor/order/package navigation. Desktop horizontal
navigation, retained mobile drawer. Real server-provided states, no invented
chart, view/tap/review counts or trial activation. Public renderer now uses the
reference's cover/avatar/serif identity and full Google/WhatsApp/Instagram rows,
plus NFC/QR explanatory panel. Shared A styling across public/setup/account UI.
Existing customer accent/logo/cover and dark theme remain supported.

ART: Generated cafe hero, garden cafe cover, transparent botanical leaves;
optimized WebP assets in assets/. Vector brand and Google/social icons.
REFERENCE: codex-clipboard-58251c76-a643-44bc-bb1e-173565777a32.png, 1578x986.
Demo surfaces /demo/botanical/dashboard.html and /demo/botanical/ reuse the real
home/profile components with explicitly fictional data and no backend calls.
Demo edit is in-memory only; QR download opens its fictional public profile.

VERIFICATION: 159 service + 5 operations tests pass, build and 61-file static
allowlist pass, changed JS/CSS syntax pass. Browser: Chrome via Playwright
(Browser plugin unavailable), 1440/1200/1030/390/360px, no horizontal overflow
on demo route sweep. 1030x700 is checked because reference laptop app is about
1030x700; mobile 390x844 and 360x800. Local actual account demo: premise selection,
all views, stable-URL save, package sections, mobile drawer, sharing/details,
search/import, estimator and admin list pass. Static preview: QR PNG download,
in-memory edit, BM/English incl dynamic status, search handoff, public dialog pass.
8 routes scanned with axe WCAG 2 A/AA + 2.1 AA: 0 automated violations after
correcting demo-caption contrast. Not a full manual WCAG certification.

VISUAL QA: Reference and rendered dashboard/mobile inspected via view_image.
Preserved composition, cream/forest/sage palette, serif headings, cafe photography,
overlapping profile identity, coloured action rows, botanical details. Intentional
differences: no fake statistics/graph/14-day trial/user avatar; package shows real
state; production navigation includes actual editor/order functions. No device
frames or presentation-board labels are embedded in the app.

PREVIEW DEPLOY: Cloudflare edad23f5-5a64-40b1-99ad-9faeb91e833e, SUCCESS,
code SHA de0bfbc31d657505f14dde6a47f71a8acc868d5d.
URL: https://edad23f5.tap-imai-site.pages.dev/demo/botanical/dashboard.html
PROFILE: https://edad23f5.tap-imai-site.pages.dev/demo/botanical/
DRAFT PR: https://github.com/askmenoob/tap-imai-site/pull/43
Hosted preview passed QR download, demo edit, language/dynamic-state switching,
search handoff, public dialogs, no overflow at 1440/1030/390/360px and zero
console or page errors. Follow-up fixes the empty-premise option value and adds
an explicit accessible name to the mobile language select. Mobile empty/error,
drawer Escape/focus restore and logout pass. Axe repeated at an actual 390px
context: eight routes, zero violations. Final branch deployment must be checked
for this follow-up commit before handoff. Production remains at the base SHA.
BLOCKER: None for the approved visual release. User review/release approved.
Cloud Run/account/billing/storage infrastructure not changed. Server file diff
only extends localhost --preview static allowlist for the new demo paths.
Authenticated Google production flows and real payments are not exercised.
24h trial remains separate undeployed work. No migration, seed, IAM or data write.

NEXT: No remaining release work after the production verification below.
On any timeout, inspect the existing process/deployment; do not repeat mutations.

## Final preview verification

UI HEAD: 6d8a402819cee5068256a32484048f75f9ad5bc1.
DEPLOYMENT: 06b89215-004e-4397-af13-9fd6dcbf1b1e — preview, SUCCESS.
DASHBOARD: https://06b89215.tap-imai-site.pages.dev/demo/botanical/dashboard.html
PROFILE: https://06b89215.tap-imai-site.pages.dev/demo/botanical/
Actual localhost account functional flows and empty/error/keyboard/logout checks
passed again on the final UI. Static hosted preview interaction checks pass.
Production canonical deployment checked and unchanged: d24d47d9 / 54a38c5.
This preview was subsequently approved and promoted; see production record below.

## Production release — 5 November 2026, Asia/Kuala_Lumpur

AUTHORIZATION: User explicitly instructed “Terbitkan A”.
PR: https://github.com/askmenoob/tap-imai-site/pull/43 — MERGED.
APPROVED HEAD: c9eda5b101deda3cfbae4503b7b079c6cca152a6, unchanged at promotion.
UI MERGE SHA: 9713169cb6217c23b43fc903af47a7f3e8d1a925.
VERIFIED DEPLOYMENT: b83fd377-dd46-47bf-927b-ac43c6501686 — production, SUCCESS.
LIVE: https://tap.imai.my ; owner /edit/ ; demo /demo/botanical/.
ROLLBACK: d24d47d9-2ad5-45ff-a60a-f444296370a8 / 54a38c5d03035636131d566a2248a2c2f2ad97cf.

Fresh pre-release verification: npm test 159/159 and operations 5/5 pass;
npm build and 61-file public allowlist pass. Git working trees clean. Preview
Cloudflare check successful; exact-head merge used. Existing infrastructure only.

Production smoke: 7 routes at 1440x1000 and 390x844 + backend health = 15 checks,
all pass. Page identity/content, no overflow, no uncaught page errors, package
estimator, BM/English and salon demo dialog verified. Botanical demo additionally
passes QR PNG download, in-memory edit, dynamic state translation, search handoff,
public dialogs and 1440/1030/390/360px route sweep on the actual domain. No live
owner record, payment or order written. Login Google button renders; config GET
configured=true; anonymous account-list GET returns 401. Health ready=true,
demo=false, shortLinks=true. Backend deployment/configuration unchanged.

SHA-256 of production CSS, account JS, public JS and botanical demo JS matches
the tested local files. Cloudflare logs confirm asset publication success.
Screenshots visually inspected on production, including mobile login and profile.
Known console noise remains: existing CSP blocks injected Cloudflare telemetry/
inline scripts and a Google inline style. No CSP weakening or unrelated hosting
configuration change was made; do not report a completely empty console.

This documentation-only follow-up records the verified UI release and may trigger
the existing Pages pipeline again. UI/assets are unchanged. Check deployment state
before any retry; no migrations, seeds, backend release or billing changes.

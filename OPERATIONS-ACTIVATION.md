# SmartTap production operations activation

Approved by the owner and activated on 26 October 2026 (Malaysia time).
This record supersedes the pre-approval status in the proposal and templates.

## Application release

- Application PR: https://github.com/askmenoob/tap-imai-site/pull/32
- Production application commit: `f1ba70aa49bb18f5902c29e21dd3e853602d8660`.
- Cloudflare Pages deployment: `402c36fd-b7c4-46a5-8ecb-f755e75dd54a`.
- Cloud Run revision: `tap-business-import-ops-20261026`, 100% traffic.
- Rollback revision retained: `tap-business-import-00039-nus`.
- Old public revision tags were removed; rollback revisions were not deleted.
- Existing runtime configuration and service IAM hashes matched the baseline
  after deployment. ToyyibPay remains live, manual payments disabled, and
  customer short-link identifiers and prices are unchanged.

Verification included 145 backend tests, five backup safety tests, five
operations-plan tests, a 52-file public build, production static/header checks,
real Google customer and super-admin login, and read-only history browsing.
No real payment or customer record change was used for acceptance.

## Private backup and recovery

- Source: `cedar-kiln-502614-h5-tap-links`.
- Backup: `smarttap-backup-cedar-kiln-502614-h5`.
- Drill: `smarttap-restore-drill-cedar-kiln-502614-h5`.
- Location: `asia-southeast1`; uniform bucket IAM and public-access prevention.
- Minimum retention: 30 days, unlocked. Lifecycle deletion after 35 days applies
  only to `snapshots/` in the backup bucket, never the source.
- Runner: `smarttap-backup@cedar-kiln-502614-h5.iam.gserviceaccount.com`;
  custom source-reader and snapshot-writer roles are bucket-scoped, with no
  delete permission. The application identity has no backup bucket binding.
- Scheduler identity: `smarttap-backup-scheduler@cedar-kiln-502614-h5.iam.gserviceaccount.com`;
  `roles/run.invoker` on the backup job only.
- Job: `smarttap-daily-backup`, one task, no automatic retries, 1 CPU/512Mi.
- Image: `asia-southeast1-docker.pkg.dev/cedar-kiln-502614-h5/smarttap-operations/backup@sha256:263669627c7686281bf2b296993ff8b9002e87cd50af49cb7cb1503c615051b0`.
- Official base image was resolved to an immutable digest. A unique Linux user
  name avoids colliding with the base image's pre-existing `backup` user.
- First successful execution: `smarttap-daily-backup-c8djj`.
- Verified snapshot: `snapshots/20261025T172403Z/`, 74 objects.
- The independent restore drill matched all 74 object names, sizes and CRC32C.
  Read-only application checks loaded seven pages, four owner-access paths,
  six orders and 51 history entries. Cross-owner reads were denied. No Google
  or payment calls, production writes or callback replays were performed.
- Scheduler: `smarttap-backup-daily`, enabled only after the copy and recovery
  checks passed. `0 18 * * *` in UTC means 02:00 Malaysia every day.
- OAuth invocation through Scheduler was verified using operator-triggered runs;
  executions `smarttap-daily-backup-9wtlg` and `smarttap-daily-backup-rdrtq`
  both succeeded and logged `backupVerified` for 74 objects. The first natural
  clock-triggered 02:00 run remains upcoming at the time of this activation.

Backups are in a separate private bucket in the same project. This protects
against application-level deletion but is not isolation from a compromised
project administrator. A changing source causes verification to fail; inspect
the logs and use a new snapshot rather than promoting an inconsistent copy.
Daily backup frequency gives a target recovery point of up to 24 hours; actual
recovery time depends on incident assessment and a reviewed restoration.

## Monitoring and notification

- Email channel: `projects/cedar-kiln-502614-h5/notificationChannels/744834623702450778`,
  destination `pillo0404@gmail.com`.
- Frontend check: `smarttap-frontend-https-GO6EmGDmqJo`.
- Backend check: `smarttap-backend-https-iSPPFbuUd_o`.
- HTTPS unavailable policy: `136948352592913116`.
- Repeated backend 5xx policy: `136948352592915389`.
- Both checks reported healthy results from all five monitoring locations.
- Controlled test notification was received at 01:17:42 Malaysia time on
  26 October 2026; temporary test policy was removed after receipt.

Backup-specific alert activation and Scheduler execution evidence are retained
in the operator's release evidence. These include failed execution detection
and absence of a successful backup for 26 hours; a healthy successful metric
was checked against the missing-success expression.

## Rollback and evidence

Pause only `smarttap-backup-daily` to stop scheduled copies. Disable only the
recorded SmartTap alerts if needed. Retain protected snapshots and the drill
copy until a separate cleanup decision. Never restore over the live bucket or
replay payment callbacks as part of a drill.

Application rollback uses the retained Cloud Run revision and the previous
Cloudflare Pages deployment. An application rollback also restores its prior
quota/payment behavior and must be assessed accordingly. No DNS change was
required for this release.

The operator's `outputs` folder holds timestamped baseline/config fingerprints,
production checks, backup and restore proofs, monitoring/email evidence,
Cloudflare screenshots and static/header comparisons. Credential values and
customer record contents are excluded from this public activation record.

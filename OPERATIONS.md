# SmartTap operations and recovery

## Permanent QR retirement

Only the verified super admin may POST `/api/admin/links/:id/purge`.
The page must first be soft-deleted. Exact business name, QR ID, explicit
confirmation and the current record revision are required. Pending payments,
payment-resolution locks, non-terminal linked orders and paid physical orders
whose fulfillment is not completed block the operation.

The generation-guarded write replaces the primary destination and owner fields
with a minimal permanent-deletion marker. This keeps the ID occupied so an old
printed QR cannot be assigned to another destination. Store reads and lists
hide these markers; app restore, media, customer and admin page reads cannot
recover the retired page. Existing order/payment records, private audit history
and retained backups are not erased by QR retirement. This is permanent URL
retirement through SmartTap, not a promise to erase all copies of business data.

Recovery operators must preserve permanent-deletion markers when restoring an
older snapshot, overlaying current retirement markers before reconnecting live
traffic. Do not deploy a backend older than marker support after using purge:
older readers do not understand the marker format. Frontend-only rollback does
not remove the durable retirement. Never restore a retired URL from history.

**Activation record:** the approved production rollout and backup/monitoring
activation on 26 October 2026 are recorded in [OPERATIONS-ACTIVATION.md](OPERATIONS-ACTIVATION.md).
The proposal below is retained as the original review package; its statements
about resources being unprovisioned describe the pre-approval state.

These changes prepare durable discovery quotas and operator tooling. They do not
prove a backup schedule, uptime alert, notification channel or recovery drill is
already enabled. No live resources are created by the default script commands.

## Concrete activation proposal (not provisioned)

`scripts/operations-plan.json` is the review/approval package for this deployment.
It uses source bucket `cedar-kiln-502614-h5-tap-links`, separate backup bucket
`smarttap-backup-cedar-kiln-502614-h5` and empty drill bucket
`smarttap-restore-drill-cedar-kiln-502614-h5` in `asia-southeast1`. Names must be
checked for availability before creation; no existing bucket may be reused just
because its name matches. Backup retention is 30 days, **unlocked**, and lifecycle
deletion starts at age 35 days only for `snapshots/` in the backup bucket.

The proposed backup identity reads the source and creates/reads snapshots, with
no delete permission. A different Scheduler identity can only invoke the named
backup job. The application identity receives no new access to backup/drill
storage. Recheck inherited project permissions before asserting isolation.
The runner needs `storage.buckets.get` as well as object permissions because the
tool verifies bucket privacy/retention before copying. Proposed narrow custom
roles and exact binding scopes are listed in the JSON; creating them is an
approval-gated account/security operation, not an action of these files.

Templates under `scripts/operations/` contain the GCS bucket payloads, Cloud Run
v2 Job, Scheduler target, disabled uptime alert and disabled backup-failure alert.
The scheduled run time is UTC 18:00, which is **02:00 Malaysia time** the next day.
Do not create/resume the Scheduler job until a manual backup and restore drill
have passed. Scheduler acceptance alone does not prove a completed backup.

The isolated image build context is **`scripts/`**, with Dockerfile
`operations/backup.Dockerfile`. It copies only `smarttap-backup.py` into the image.
Resolve the official base image to a reviewed immutable digest before building;
pin the resulting image digest in `cloud-run-job.template.json`. The runner uses
the attached backup service account through Google metadata credentials, without
JSON key files or app/payment secrets. It invokes `backup --execute` and derives
a fresh UTC snapshot timestamp each execution. The Dockerfile was inspected and
its tool tested locally; no container build or provider resource creation is
claimed by this package.

Read-only metadata found no existing Monitoring notification channels. The
proposed email contact **pillo0404@gmail.com** is only a proposal. Creating a
channel, requesting verification or sending a test requires user approval.
No email has been sent. Alert JSON deliberately contains placeholders and stays
disabled until actual created check IDs and an approved verified channel exist.
An enabled failure alert must be tested on an isolated failing job first; a
missing-daily-success watch must also be configured before claiming unattended
backup monitoring complete. None of these are currently active.

The plan is not free infrastructure: Google may charge for copies/retention,
storage operations, image storage/build, Cloud Run Jobs, Scheduler and Monitoring.
Review prices/account quotas before activation. Source, app identity, DNS and
live payments remain untouched by the planning package. Rollback starts by
pausing only the named scheduler and disabling only the newly recorded monitors;
retain backups and do not perform an in-place live restore.

## Durable discovery quotas

Production uses a generation-guarded GCS object at
`quotas/discovery/YYYY-MM-DD.json`. A successful reservation atomically increases
the shared UTC-day total, that action's daily count and a client's minute count.
The client key is an HMAC of IP + day; raw IP addresses are not persisted. A
restart/new Cloud Run instance cannot reset the daily cap. Failed quota reads,
malformed records, repeated write contention and write failures return HTTP 503
before discovery or paid Google calls run. Exhausted limits return HTTP 429.

The preview server uses an isolated memory store. Production uses `QUOTA_BUCKET`
when specified, otherwise `SHORT_LINK_BUCKET`. Keep the bucket private. Verify
the runtime service account can get/create/replace objects under `quotas/discovery/`
before releasing (`storage.objects.get`, `storage.objects.create` and
`storage.objects.delete`; replacing a GCS object needs create and delete, while
metadata-update alone is insufficient). An existing role restricted to `links/`
is insufficient. Do
not expose the bucket or give the runtime owner/admin permissions to fix access.
The module makes metadata/read/CAS GCS requests per accepted request; these are
normal storage operations and are not a new service, but do have storage pricing.

Defaults (all configurable with positive integer environment values):

| Setting | Default |
| --- | ---: |
| `MAX_DAILY_REQUESTS` — all discovery actions combined | 300 |
| `QUOTA_DAILY_SUGGEST` | 180 |
| `QUOTA_DAILY_SEARCH` | 60 |
| `QUOTA_DAILY_IMPORT` | 60 |
| `QUOTA_DAILY_CREATE` / `QUOTA_DAILY_SHORTEN` | 100 each |
| `QUOTA_MINUTE_SUGGEST` — per client | 30 |
| Other `QUOTA_MINUTE_<ACTION>` — per client | 12 |

The sum of action caps may exceed the shared total; the first reached cap wins.
Reserved slots are not refunded on a downstream Google failure. No automatic
increase is performed. Suggestions/import calls have different upstream costs;
these caps are request limits, not an exact currency spend ceiling. Provider-side
API quotas and billing budget alerts are still required. Budgets send alerts and
are not guaranteed spend stops.

Only production with Cloud Run's `K_SERVICE` trusts X-Forwarded-For, using the
rightmost Google-appended valid address. Caller-supplied leftmost XFF and
CF-Connecting-IP are never trusted. Invalid/oversized lists share a restrictive
invalid-client quota. This assumes requests reach the managed Cloud Run ingress;
reassess the trust boundary if placing a new proxy directly in front of Node.

Release verification: check a deployed request creates/updates today's private
quota object without logging its contents; confirm unauthenticated unknown API
paths do not reserve quota; inspect 429/503 request rates. Do not hammer public
Google-backed endpoints to test limits. Run local quota tests for exhaustion,
restart, races and storage failure. Rollback to the prior Cloud Run revision if
new 503s indicate IAM/availability problems, preserving the quota records. A
rollback restores the old process-local limitation, so record this explicitly.
Retain quota objects only as long as operationally needed (suggested 35 days),
using a bucket lifecycle rule restricted to `quotas/discovery/`. Never use a
bucket-wide delete rule on the live data bucket.

## Independent backup and restore drill

Prerequisites requiring a separately reviewed infrastructure operation:

1. Provision a different private bucket named `smarttap-backup-...`, preferably
   under an independent backup identity/project. Enforce public-access prevention,
   uniform bucket IAM and at least 30 days retention. Do not lock retention until
   the retention period has been reviewed. Keep the existing live bucket intact.
2. Give a backup identity read-only source access and destination object creation
   access. The app runtime must not be able to delete backup objects. Use a
   separate restore-drill identity/target. These scripts grant no IAM.
3. Before scheduling, run one copy + verification and one restoration into an
   empty private `smarttap-restore-drill-...` bucket. The tool refuses restore to
   production or the backup bucket and never deletes source objects.

Prepare a plan without cloud calls:

```powershell
python scripts/smarttap-backup.py backup --source=LIVE_BUCKET --backup=smarttap-backup-CHOSEN_NAME --snapshot=20261025T010000Z
```

After the separately provisioned bucket/access is verified, `--execute` performs
the copy. The tool compares names, byte sizes and CRC32C across before/after
source manifests and the copied snapshot. A changing source fails verification;
use a new snapshot and a quiet/paused-write maintenance window. It does not claim
a transactionally consistent application snapshot while writes are in flight.
All prefixes, including links, owner indexes, checkout records, history, media
and quota records are copied together. Successful output says `backupVerified`.

```powershell
python scripts/smarttap-backup.py backup --source=LIVE_BUCKET --backup=smarttap-backup-CHOSEN_NAME --snapshot=20261025T010000Z --execute
python scripts/smarttap-backup.py verify --source=LIVE_BUCKET --backup=smarttap-backup-CHOSEN_NAME --snapshot=20261025T010000Z --execute
python scripts/smarttap-backup.py restore-drill --source=LIVE_BUCKET --backup=smarttap-backup-CHOSEN_NAME --snapshot=20261025T010000Z --restore-bucket=smarttap-restore-drill-CHOSEN_NAME --execute
```

Note `verify` against the live source is intended immediately after copying. An
older snapshot naturally differs once production has changed; validate it via a
restore drill. The drill's `restoreVerified` confirms object equality only. Point
an isolated preview at the restored bucket and test identity/ownership, public
page, catalog media and order reads. Disable real ToyyibPay and Google writes in
that preview. Never replay callbacks or re-enable live bills as part of a drill.

After the first successful drill, schedule daily backups with distinct timestamp
prefixes through the approved runner. Monitor the exit status and require both
copy and verification success. Review 30/90-day retention, deletion lifecycle
and costs before applying lifecycle rules. At 24-hour backup frequency the target
RPO is at most 24 hours only while jobs succeed; measure RTO during the drill.

Recovery promotion requires a separate maintenance decision: freeze writes,
choose a verified snapshot, reconcile later provider payments, test in isolation,
then switch configuration. These tools deliberately offer no in-place production
restore. Rollback is to leave the existing live bucket/revision in place. A failed
snapshot remains unverified; do not delete or overwrite existing backups to hide
the failure. No tokens or object contents are printed by this tool.

## Uptime monitoring preparation

The preparation script only writes local JSON. It does not call Google APIs,
create checks or send messages. Select an already-approved, verified notification
channel in `cedar-kiln-502614-h5`; creating a contact/channel is a separate step.

```powershell
node scripts/prepare-smarttap-monitoring.mjs --output=outputs/monitoring
```

Review `uptime-frontend.json` and `uptime-backend.json`. They check HTTPS/SSL and
HTTP 200 every five minutes from three regions. The backend also requires the
health response to report `shortLinks:true`. This is availability coverage, not
proof that OAuth, Places, payment settlement or every customer page works.

Apply the reviewed files with Google Cloud Monitoring's
`projects.uptimeCheckConfigs.create` API (or console); retain the returned check
IDs and resource names. Prepare the alert only after IDs and the notification
destination are known:

```powershell
node scripts/prepare-smarttap-monitoring.mjs --output=outputs/monitoring --channel=projects/cedar-kiln-502614-h5/notificationChannels/CHANNEL_ID --checkIds=FRONTEND_CHECK_ID,BACKEND_CHECK_ID
```

Review/apply `alert-uptime.json` with `projects.alertPolicies.create`. It groups
results per check and triggers when at least two locations report failure for
five minutes. Verify all checks turn green, use the channel's built-in test and
perform a controlled failure against an isolated test endpoint. Do not take the
production app down to test an alert. Record the policy/check IDs and test receipt
before claiming monitoring is enabled. Also configure Cloud Run 5xx/latency and
payment-review alerts once operational thresholds and notification owners have
been chosen; no provider success is inferred from uptime alone.

Rollback: disable only the newly created SmartTap alert policy, then delete only
the two recorded new uptime-check resources. Never delete all project policies
or unrelated checks. Removing monitoring does not change DNS, hosting or payment
configuration.

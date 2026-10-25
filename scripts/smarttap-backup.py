"""Prepare, copy and verify independent SmartTap snapshots. Default: plan only.

Never restores over the live bucket. Requires an already-provisioned private
backup bucket and existing gcloud access. Does not grant IAM or create resources.
"""
import argparse
import datetime
import json
import re
import shutil
import subprocess
import urllib.parse
import urllib.request


def bucket(value):
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{2,62}", value):
        raise ValueError("Invalid bucket name")
    return value


def command(args, capture=False):
    binary = shutil.which("gcloud.cmd") or shutil.which("gcloud")
    if not binary:
        raise RuntimeError("gcloud is required")
    result = subprocess.run([binary, *args], capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError("gcloud operation failed; inspect permissions and bucket configuration")
    if capture:
        return result.stdout.strip()


def api(path):
    token = command(["auth", "print-access-token"], capture=True)
    request = urllib.request.Request("https://storage.googleapis.com/storage/v1/" + path,
                                     headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def private_bucket(name, backup=False):
    meta = api("b/" + name)
    iam = meta.get("iamConfiguration", {})
    if iam.get("publicAccessPrevention") != "enforced" or not iam.get("uniformBucketLevelAccess", {}).get("enabled"):
        raise RuntimeError("Bucket must enforce private access and uniform bucket IAM")
    if backup:
        # Refuse to describe a copy as a durable backup without independent
        # deletion protection. The operator chooses/approves retention first.
        retention = int(meta.get("retentionPolicy", {}).get("retentionPeriod", 0))
        if retention < 30 * 86400:
            raise RuntimeError("Backup bucket requires at least 30 days retention")


def manifest(name, prefix=""):
    found = {}
    token = None
    while True:
        params = {"prefix": prefix, "maxResults": "1000", "fields": "items(name,size,crc32c),nextPageToken"}
        if token:
            params["pageToken"] = token
        page = api("b/" + name + "/o?" + urllib.parse.urlencode(params))
        for item in page.get("items", []):
            relative = item["name"][len(prefix):]
            if not relative or not item.get("crc32c"):
                raise RuntimeError("Invalid object manifest")
            found[relative] = (item["size"], item["crc32c"])
        token = page.get("nextPageToken")
        if not token:
            return found


def run(args):
    source, destination = bucket(args.source), bucket(args.backup)
    if source == destination or not destination.startswith("smarttap-backup-"):
        raise ValueError("Backup must be a separate smarttap-backup- bucket")
    snapshot = args.snapshot or datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    if not re.fullmatch(r"\d{8}T\d{6}Z", snapshot):
        raise ValueError("Snapshot must use YYYYMMDDTHHMMSSZ")
    prefix = "snapshots/" + snapshot + "/"
    copy_args = ["storage", "rsync", "gs://" + source, "gs://" + destination + "/" + prefix, "--recursive"]
    if args.mode == "restore-drill":
        target = bucket(args.restore_bucket or "")
        if target in (source, destination) or not target.startswith("smarttap-restore-drill-"):
            raise ValueError("Restore target must be a separate smarttap-restore-drill- bucket")
        copy_args = ["storage", "rsync", "gs://" + destination + "/" + prefix, "gs://" + target, "--recursive"]
    if not args.execute:
        print(json.dumps({"mode": args.mode, "snapshot": snapshot, "execute": False,
                          "command": ["gcloud", *copy_args, "--dry-run"],
                          "note": "Plan only. No infrastructure or data changed."}, indent=2))
        return
    private_bucket(source)
    private_bucket(destination, backup=True)
    if args.mode == "restore-drill":
        private_bucket(target)
        if manifest(target):
            raise RuntimeError("Restore drill target must be empty")
        before = manifest(destination, prefix)
        if not before:
            raise RuntimeError("Snapshot is empty or missing")
        command(copy_args)
        if before != manifest(target):
            raise RuntimeError("Restore drill failed: object count or checksums differ")
        print(json.dumps({"restoreVerified": True, "objects": len(before), "productionUntouched": True}))
        return
    before = manifest(source)
    if not before:
        raise RuntimeError("Source is empty; refusing to produce an empty backup")
    if args.mode == "backup":
        if manifest(destination, prefix):
            raise RuntimeError("Snapshot prefix already exists; choose a new snapshot")
        command(copy_args)
    after, copied = manifest(source), manifest(destination, prefix)
    if before != after or before != copied:
        raise RuntimeError("Snapshot NOT verified: source changed or copied checksums differ. Retry with a new snapshot; never promote this copy.")
    print(json.dumps({"backupVerified": True, "snapshot": snapshot, "objects": len(before)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=["backup", "verify", "restore-drill"])
    parser.add_argument("--source", required=True)
    parser.add_argument("--backup", required=True)
    parser.add_argument("--snapshot")
    parser.add_argument("--restore-bucket")
    parser.add_argument("--execute", action="store_true")
    options = parser.parse_args()
    if options.mode != "backup" and not options.snapshot:
        parser.error("verify and restore-drill require --snapshot")
    try:
        run(options)
    except Exception as error:
        # OAuth tokens, request headers and object contents must never be logged.
        print("Operation stopped: " + (str(error) if isinstance(error, (ValueError, RuntimeError)) else type(error).__name__))
        raise SystemExit(1)

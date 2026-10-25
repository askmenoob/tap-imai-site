import contextlib
import importlib.util
import io
import pathlib
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("backup", pathlib.Path(__file__).with_name("smarttap-backup.py"))
backup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(backup)


class BackupSafetyTests(unittest.TestCase):
    def args(self, **changes):
        values = dict(source="smarttap-live", backup="smarttap-backup-independent", snapshot="20261025T010000Z", mode="backup", execute=False, restore_bucket=None)
        values.update(changes)
        return types.SimpleNamespace(**values)

    def test_default_plan_never_calls_cloud(self):
        with patch.object(backup, "api", side_effect=AssertionError("cloud call")), patch.object(backup, "command", side_effect=AssertionError("cloud command")), contextlib.redirect_stdout(io.StringIO()) as output:
            backup.run(self.args())
        self.assertIn('"execute": false', output.getvalue())
        self.assertIn('"--dry-run"', output.getvalue())

    def test_unsafe_backup_and_restore_paths_rejected_before_cloud_access(self):
        cases = [dict(backup="smarttap-live"), dict(backup="other-bucket"), dict(source="../live"), dict(snapshot="../live"), dict(mode="restore-drill", restore_bucket="smarttap-live"), dict(mode="restore-drill", restore_bucket="smarttap-backup-independent")]
        with patch.object(backup, "api", side_effect=AssertionError("cloud call")):
            for case in cases:
                with self.assertRaises(ValueError):
                    backup.run(self.args(**case))

    def test_snapshot_checksum_change_fails_verification(self):
        before = {"links/example.json": ("20", "abc")}
        changed = {"links/example.json": ("20", "xyz")}
        with patch.object(backup, "private_bucket"), patch.object(backup, "command") as command, patch.object(backup, "manifest", side_effect=[before, {}, changed, before]):
            with self.assertRaisesRegex(RuntimeError, "NOT verified"):
                backup.run(self.args(execute=True))
            command.assert_called_once()

    def test_restore_drill_requires_empty_target_and_preserves_source(self):
        with patch.object(backup, "private_bucket"), patch.object(backup, "command") as command, patch.object(backup, "manifest", return_value={"existing": ("2", "crc")}):
            with self.assertRaisesRegex(RuntimeError, "empty"):
                backup.run(self.args(mode="restore-drill", restore_bucket="smarttap-restore-drill-test", execute=True))
            command.assert_not_called()

    def test_private_backup_requires_retention_and_public_access_prevention(self):
        for metadata in [{}, {"iamConfiguration": {"publicAccessPrevention": "enforced", "uniformBucketLevelAccess": {"enabled": True}}}]:
            with patch.object(backup, "api", return_value=metadata), self.assertRaises(RuntimeError):
                backup.private_bucket("smarttap-backup-test", backup=True)


if __name__ == "__main__":
    unittest.main()

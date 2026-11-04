# SMARTTAP — Connected Hub redesign

- [x] Audit GitHub main, Ubuntu workspaces, Cloudflare production and build setup.
- [x] Preserve rollback: commit 8b5d630cd049f7e562923c6bce0ff696cc6c491c,
  Cloudflare deployment 3e86008d-2ab2-4510-9e10-289656ed750f.
- [x] Apply Concept B design system to setup, owner/admin, packages, public/demo,
  catalogue, legal and offline surfaces.
- [x] Preserve all API/auth/storage/billing contracts and existing selected logo.
- [x] Build/static allowlist; 159/159 tests; desktop/mobile browser flows.
- [x] WCAG A/AA automated checks on six core routes; fix pricing caption contrast.
- [ ] Verify Cloudflare preview, promote existing main deployment, smoke production.
- [ ] Record final commit/deployment and verification in .ai/checkpoint.md.

Separate existing work (not activated by this visual release): 24-hour trial
backend in PR #41 / Ubuntu smarttap-trial-work. Its checkpoint records missing
Cloud Run deployment access. Keep the server feature flag and production state
unchanged until that feature's release is separately verified.

Full original master-prompt text and last mockup are not retrievable from the
linked chat export. The supplied written Concept B specification is preserved
in .ai/design-standard.md; exact image comparison remains unavailable.

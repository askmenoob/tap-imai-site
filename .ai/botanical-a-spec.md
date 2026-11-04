# Accepted design A — Botanical Premium Tech

Approved by user: 5 November 2026, after rejecting the previous B implementation.
Reference: codex-clipboard-58251c76-a643-44bc-bb1e-173565777a32.png (1578×986).
The reference board contains a laptop viewport approximately 1030×700 and a
mobile profile approximately 330×650, rather than a single browser screenshot.
Compare those surfaces separately at 1440×1000 / 1200×820 and 390×844 / 360×800.

## Contract
Build the actual owner home/dashboard and mobile public profile using the
reference's composition. Preview only; the user will review before production.
Keep existing account, tenant, profile, QR, catalogue, checkout and order APIs.
No analytics API exists: use clear empty states, no invented statistics/chart.
Trial backend is not deployed: display the real subscription status and date.
All fictional demo content must be explicitly labelled and isolated from records.

## Extracted visual system
- Background: warm ivory #f8f5ee. Surfaces #fffdf8 / #f4efe4.
- Header and primary action: forest green #123d31, deeper #0d3027.
- Muted sage #dfe8d1; gold #b38b3d; ink #182c26; muted #5d685f.
- Display typography: Georgia serif, upright, heavy; UI: native sans 13–15px.
- 16–22px rounded cards, warm fine borders, soft restrained shadows.
- Desktop header includes logo, horizontal navigation and real account controls.
- First row: hero photo + HTML heading/actions (left two thirds); business
  selector and subscription (right third). Hero photo has natural colours, no
  colour overlay. A cream curved/diagonal text region reproduces the reference.
- Below: 3 stat empty states, activity empty state, right profile preview.
- Bottom: sage search/import band, real link to existing search workflow.
- Mobile public: prominent cover, overlapping cream circular logo, large serif
  business name, summary, Google/WhatsApp/Instagram full width links with coloured
  icons and arrows, then NFC/QR information panel with botanical corner art.
- Reuse matching icon geometry consistently; production logo uses code-native
  NFC/radio mark derived from the approved reference. Existing customers' marks,
  cover and selected profile colours retain authority.
- Generated assets: cafe hero, garden storefront cover, transparent botanical
  leaves, optimized locally as WebP; no remote font or media dependency.
- Motion: short fades only, reduced-motion respected. Clear focus rings,
  semantic controls, AA text contrast, minimum 44px main touch controls.

## Allowed first viewport copy
Reference hero: “Your business, one tap away”; supporting Malay explanation
and Tambah Premis / Jana QR. Dynamic premise name, package status/date and
account details must come from the authenticated API. View/NFC/Review counters
show — with unavailable text. Home demo uses Kafe Taman Kota, labelled fiction.
No fake person, avatar, notifications, 14-day trial or analytics data.

Required verification: reference and rendered screenshots inspected together;
palette, layout, typography, hero crop, profile anatomy, spacing and responsive
behaviour ledger; functional tests and manual flows; automated accessibility;
Cloudflare branch preview. No merge or production deployment during this step.

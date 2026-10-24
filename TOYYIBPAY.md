# ToyyibPay checkout

## Current launch gate

Integration is configured for the existing ToyyibPay merchant account. The owner explicitly chose to keep live checkout closed until the account is verified. Never automatically open checkout just because DuitNow QR is activated. The merchant dashboard showed Unverified on 24 October 2026; settlement awaits account verification.

Cloud Run service: tap-business-import, project cedar-kiln-502614-h5, region asia-southeast1. Runtime key is a Secret Manager reference to smarttap-toyyibpay-key; do not put the key in source, static assets, logs or chat. The dedicated category is configured by TOYYIBPAY_CATEGORY_CODE.

Required launch settings: TOYYIBPAY_ENABLED=true AND TOYYIBPAY_ACCOUNT_VERIFIED=true, with live credentials and TOYYIBPAY_MODE=live. Both booleans are false in the prepared release. Only enable after refreshed merchant verification evidence and owner authorization to open payments. TOYYIBPAY_DUITNOW_QR=true requires the merchant channel to remain active. Gateway fees are borne by the merchant; product prices remain unchanged.

## Boundaries

Customer authentication/ownership is enforced for create, status and cancel. Server prices every order from the existing catalog. Checkout is a hosted ToyyibPay redirect; bank credentials are never collected by SmartTap. The return URL is display/navigation only, never proof of payment. After sign-in, SmartTap queries its own server to reconcile the private order.

Public callback: POST /api/toyyibpay/callback, application/x-www-form-urlencoded. Validate the documented hash, stored bill/order/mode/amount, then independently query getBillTransactions. A matching successful transaction and invoice are required. Durable page application markers and payment claims prevent double renewal after duplicate notifications or partial storage failures. Deleted/transferred/cancelled orders are held for admin review instead of activating a different owner's page. Unpaid bills can be cancelled only after provider checks.

Old short URLs, NFC-only behavior, manual review and super-admin message boxes remain supported. An open ToyyibPay bill blocks manual submission for the same page until settled or cancelled. Never mix sandbox transactions with production records.

## Verification

npm test
npm run build
node scripts/prepare-pages.mjs

Local UI simulation: PORT=8802 PREVIEW_DEMO=1 node import-service/server.mjs --preview. This uses an explicitly labelled local provider, not the ToyyibPay sandbox. Its /demo/toyyibpay pages are available only on the localhost preview and are never in the public static package. Use isolated storage and sandbox credentials for future actual dev.toyyibpay.com tests. Production server refuses sandbox mode.

Prepared-release evidence: signed identity HTTP checks, provider contract/error responses, private ownership/reassignment, fixed/bulk pricing, wrong/forged callbacks, pending/failed payment, retry/replay/concurrency, storage crash, manual coexistence, and annual/NFC-only behavior. No real or ToyyibPay-sandbox payment has been performed in this release.

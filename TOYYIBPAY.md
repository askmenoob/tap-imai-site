# ToyyibPay checkout

## Current launch gate

The owner explicitly authorized live ToyyibPay-only payments on 24 October 2026, accepted that settlement is held until verification, and supplied a ToyyibPay support message confirming that payments can already be received. Do not misrepresent the merchant as verified.

Cloud Run service: tap-business-import, project cedar-kiln-502614-h5, region asia-southeast1. Runtime key is a Secret Manager reference to smarttap-toyyibpay-key; never put it in source, static assets, logs or chat. The dedicated category is configured by TOYYIBPAY_CATEGORY_CODE.

Launch settings: TOYYIBPAY_ENABLED=true, TOYYIBPAY_ACCOUNT_VERIFIED=false, TOYYIBPAY_SETTLEMENT_HOLD_ACCEPTED=true, TOYYIBPAY_MODE=live, TOYYIBPAY_DUITNOW_QR=true. The explicit hold-acceptance flag is separate from account verification. Gateway fees are borne by the merchant; approved product prices remain unchanged.

MANUAL_PAYMENTS_ENABLED=false closes all new manual payment submissions (HTTP 410), hides the personal payment QR, and removes its payload from plan responses. Existing manual records and super-admin review of pending payments remain available for audit and completion. The old personal QR image is no longer in the static release.

## Boundaries

Customer authentication/ownership is enforced for create, status and cancel. Server prices every order from the existing catalog. Checkout is a hosted ToyyibPay redirect; bank credentials are never collected by SmartTap. The return URL is display/navigation only, never proof of payment. After sign-in, SmartTap queries its own server to reconcile the private order.

Public callback: POST /api/toyyibpay/callback, application/x-www-form-urlencoded. Validate the documented hash, stored bill/order/mode/amount, then independently query getBillTransactions. A matching successful transaction and invoice are required. Durable page application markers and payment claims prevent double renewal after duplicate notifications or partial storage failures. Deleted/transferred/cancelled orders are held for admin review instead of activating a different owner's page. Unpaid bills can be cancelled only after provider checks.

Old short URLs, NFC-only behavior, historical manual review and super-admin message boxes remain supported. New purchases and renewals use ToyyibPay only. Never mix sandbox transactions with production records.

## Verification

npm test
npm run build
node scripts/prepare-pages.mjs

Local UI simulation: PORT=8802 PREVIEW_DEMO=1 node import-service/server.mjs --preview. This uses an explicitly labelled local provider, not the ToyyibPay sandbox. Its /demo/toyyibpay pages are available only on the localhost preview and are never in the public static package. Use isolated storage and sandbox credentials for future actual dev.toyyibpay.com tests. Production server refuses sandbox mode.

Prepared-release evidence: signed identity HTTP checks, provider contract/error responses, private ownership/reassignment, fixed/bulk pricing, wrong/forged callbacks, pending/failed payment, retry/replay/concurrency, storage crash, manual coexistence, and annual/NFC-only behavior. No real transfer of funds or ToyyibPay-sandbox payment has been performed. A live connection-test bill may be created and cancelled without payment to verify provider compatibility.

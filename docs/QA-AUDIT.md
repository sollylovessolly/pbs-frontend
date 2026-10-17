# App audit — 21 September 2026

## Payment diagnosis and fix

The checkout form had lost its required `checkoutKey` and reverted to redirecting to the payment provider. The backend's key-validation message was intentionally converted to the generic error reported by the customer.

Confirmed against the deployed API without creating an order:
- Request without a checkout key: HTTP 400, `checkoutKey is required for retry-safe website checkout`.
- Same validation-only request with a UUID and a deliberately nonexistent SKU: HTTP 404 for that SKU, demonstrating key validation passed.

Restored a stable UUID saved alongside the exact order payload before submission. Retries preserve the same key; payment retries preserve the existing order. Restored Paystack's popup and backend-verified success modal. If initialization reports an already-paid order, an existing reference opens verification instead of another payment. Closing an unconfirmed-payment modal leaves the customer on checkout with their cart.

## Other fixes

- Cart promo codes now carry through to checkout for backend validation instead of always being rejected by a placeholder handler.
- Malformed saved cart entries no longer crash the storefront; valid legacy entries remain subject to checkout validation.
- Generated phone-case thumbnails use the correct category fallback after refresh, rather than a Polaroid photograph.
- Added About and Delivery destinations using existing business copy; repaired the FAQ anchor.
- Terms and Privacy wording subsequently approved by the owner and added at `/terms` and `/privacy`, with footer and checkout links. Internal operational notes are omitted from customer-facing pages. Changes are local to the app; live-host deployment has not been performed.
- The vintage PDF test needed more than its old five-second assertion deadline under concurrent test load. Export passes with an explicit 15-second deadline; failures still surface and are not ignored.

## Validation

- Production build: `npm run build -- --webpack` passed.
- TypeScript, ESLint and formatting passed.
- Unit tests: **18 passed**.
- Production Chrome browser tests: **44 passed** in the final complete run.

Browser coverage includes catalogue availability, all five product pages, real Polaroid/photostrip PNG generation, vintage PDF generation, crop bounds across rotations and saved previews, phone-case and album cart flows, discounts, checkout validation and duplicate prevention, response-loss recovery, popup success/cancellation/error, already-paid recovery, mismatched/unconfirmed verification, tracking by phone/PBS number/token, mobile layouts, broken footer links, admin login/session expiry, dashboard, order filters/detail/manual creation, payment recording, cancellation inventory choices, status updates, catalogue edits, restocking, purchase costing, expenses and withdrawals.

All order/payment/admin mutations in the browser suite use mocked API responses. Print generation itself runs in the browser. The suite does not charge cards, mark real orders paid or change real inventory.

## Live checks

- Deployed health, products (five categories) and delivery rates returned HTTP 200.
- Chrome can read deployed product and rate responses with no CORS failures.
- The actual Paystack v2 script loads and provides its popup constructor.
- One generated 1-pixel PNG uploaded successfully (HTTP 201), then downloaded as `image/png` (HTTP 200). No customer images were used. The earlier storage outage is not reproduced.
- No live order or financial transaction was created.

## Open release items

1. Owner confirms Paystack is in test mode pending KYC. Complete a controlled test-mode transaction through the deployed backend and confirm verification, webhook handling and notifications. KYC/live activation is separate from making test-mode checkout work. Loading the real SDK plus mocked payment tests does not prove end-to-end provider configuration.
2. Owner confirms admin access works. Automated coverage also checks session restoration and expiry; this does not independently verify every live admin permission.
3. Personalized phone cases are still disabled. The current backend advertises package prices and its source now accepts artwork. The frontend's personalized package must be connected to that newer contract and tested before enabling it.
4. Only one active delivery rate is configured. Add intended states before expecting nationwide checkout choices.
5. The public delivery-rate list has no IDs, but admin edit/deactivate needs IDs. A protected rate-list contract is still required for those actions.
6. Policy wording is approved and available in the app. Confirm and implement photo-retention/deletion, provider/notification access and publicity-consent records. No automatic photo-deletion schedule was found or promised.
7. Proof a physical sample of each print format. Browser export checks cannot certify print trim, colour or production quality.

See `BACKEND-FOLLOWUPS.md` for the broader backend handoff, distinguishing historic findings from this audit's live checks.

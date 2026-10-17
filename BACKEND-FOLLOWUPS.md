# Reminder: return to the backend follow-ups

## Rechecked 21 September 2026

- **Upload outage is no longer reproduced:** a generated 1-pixel PNG uploaded with HTTP 201 and downloaded with HTTP 200 (`image/png`). The earlier 503 storage outage is historical; no backend change was made in this audit.
- **Checkout regression was frontend-side:** missing `checkoutKey` was confirmed against the deployed API (HTTP 400). The frontend now sends a stable UUID and reuses the same saved payload after response loss. A deliberately nonexistent SKU passed key validation and returned 404 without creating an order.
- Public products and delivery rates respond with HTTP 200 in Chrome, with no CORS errors. Only one active delivery state is currently configured. Add other intended states in admin before advertising their availability at checkout.
- The Paystack browser SDK loads. Browser payment flows are tested with simulated provider callbacks; real Paystack test-mode initialization, payment verification/webhooks and real admin credentials still need a controlled staging check.
- Personalized phone cases remain disabled in the frontend. The current backend publishes package prices and its source accepts photo references; reconcile and test that complete feature before enabling it. This is no longer accurately described as the backend always discarding those fields.
- Privacy and Terms wording is owner-approved and added to `/privacy` and `/terms`. `docs/CUSTOMER-POLICIES-DRAFT.md` retains internal follow-ups: confirm artwork retention/deletion, provider access, production partners and notification recipients. No automatic deletion schedule is promised.

After reviewing the admin UI, return to the backend integration and release checks below. This is the earlier handoff preserved for follow-up, not a claim that every issue still exists: the sibling backend now contains changes such as checkout keys, payment reconciliation fields and phone-case package options. Recheck the deployed API and its frontend contracts before closing each item. No backend code was changed as part of the admin build.

## Customer checkout and production

- Confirm public product, tracking and payment-verification responses use customer-safe DTOs. Supplier costs, private notes, resource usage and profit snapshots must remain private.
- Verify personalised phone-case artwork survives validation and is available for fulfillment. Publish authoritative package prices and package-specific availability; then enable supported customer options.
- Verify order-creation idempotency and recovery of an existing unpaid checkout, including response loss and retries.
- Verify payment initialization reuses valid pending attempts; handle duplicate successful references with explicit reconciliation.
- Verify a payment received after inventory becomes unavailable has a recoverable fulfillment state. Repeated verification must not silently skip required stock handling.
- Bind courier selections to the correct cart, address and expiry. Define whether the customer pays the published state fee or the courier quote, and preserve the distinction from actual courier cost.
- Validate email/phone/address and reject whitespace-only required values server-side.
- Validate production references against trusted uploads and the correct purpose, MIME type, size and ownership. Define download access and URL lifetime for private files.
- Specify final print dimensions, bleed and resolution; physically proof the generated print exports.

## Admin API gaps observed during integration

- `GET /delivery-rates` returns state, fee and isActive without IDs, while PATCH/DELETE require an ID. Add an authenticated list/detail contract with IDs so the UI can edit/deactivate existing rates.
- Ensure authenticated catalogue screens can list inactive records and internal supplier costs, separately from safe public catalogue DTOs. The deployed product list currently returns active products only.
- Publish response schemas and accurate boolean request schemas for customer archiving and cancellation inventory restoration. Keep finance, pagination, shipment and stock contracts documented.
- Expose reconciliation/stock-recovery actions and states if required by the updated payment flow. The present UI only offers actions documented in the deployed specification.
- The supplied designs mention deadlines and delivery booking; no corresponding documented editable deadline/book-shipment endpoint was found. Implement these only if those workflows are wanted. Current admin shows actual status history and supported shipment retry.

## Deployment verification

- Set the production frontend origin in backend CORS configuration and verify preflight requests with Authorization headers.
- Verify frontend API base URL, backend public URL, Paystack mode/callback/webhook configuration, and production storage, email and courier credentials.
- Confirm admin login with a real account on staging; test permissions, an unpaid manual order, inventory restock, payment confirmation and shipment recovery with controlled test data.
- Use a staging payment flow to check callbacks and notifications. Mocked frontend tests do not prove real bank receipts, courier booking or production configuration.

## Gallery albums and photo reviews (22 September 2026)

Frontend screens and request contracts are implemented. Backend endpoints, isolated private media storage, album publishing and review moderation still need implementation. Use the complete handoff: [BACKEND-GALLERY-REVIEWS-PROMPT.md](docs/BACKEND-GALLERY-REVIEWS-PROMPT.md). Do not reuse production-order artwork as public gallery/review media. No automatic publication or WhatsApp messages are authorized by these features.

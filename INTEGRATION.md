# Customer backend integration

The existing Next.js App Router, React Context cart, Tailwind styling and design assets are retained. The deployed OpenAPI was inspected on 2026-09-17; unspecified response fields were checked against the adjacent NestJS source. No live orders or payments were created during this audit. A generated 1-pixel PNG was uploaded and retrieved to check storage on 2026-09-21.

## Configuration

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_API_URL=https://polaroidsbysolly-be.onrender.com/api` (or your local API URL).
- `NEXT_PUBLIC_PAYSTACK_TEST_MODE=true` while your backend uses test credentials; change to `false` for production payments.

Public Next.js variables are embedded at build time: rebuild after changing them. No secret keys belong in this repository. Configure the Paystack dashboard callback URL (the backend currently omits `callback_url` from initialization) to the frontend `/payments/callback`; `/order/success` also verifies the returned reference. Configure backend CORS for the actual frontend origin.

## Routes and API calls

| UI                                                                     | Backend                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Home and `/products`                                                   | `GET /products`                                                                                             |
| `/products/{polaroids,photostrips,vintage-letters,phone-cases,albums}` | `GET /products`; supported production assets use `POST /uploads`                                            |
| `/cart`                                                                | Persistent SKU, catalogue price, quantity limit and uploaded references                                     |
| `/checkout`                                                            | `GET /products`, `GET /delivery-rates`, `POST /shipping/rates`, `POST /orders`, `POST /payments/initialize` |
| `/payments/callback`, `/order/success`                                 | `POST /payments/verify`                                                                                     |
| `/track-order`                                                         | `POST /tracking/orders`                                                                                     |
| `/orders/[orderNumber]` (segment contains the opaque token)            | `GET /tracking/:token`                                                                                      |

The typed API also exposes `GET /products/:id` and `GET /delivery-rates/:state`; screens already holding those results do not make redundant calls. Health is not polled.

## Behavior

- Catalogue variants provide stock, limits and selling prices. Images/routes are centralized by category.
- Confirmed photostrip mapping: 1 Memories Noir, 2 Classic Black, 3 Blue Moments, 4 Vintage Ticket, 5 Looking Good. Each configuration retains its own backend SKU.
- Vintage designs/finishes map to the confirmed `VINTAGE-*-NORMAL` and `VINTAGE-*-BURNT` SKUs.
- Polaroids export PNG artwork plus a smaller PNG preview; photostrips export their composed PNG; vintage letters export an A4 PDF with the chosen artwork, font and front/back text, without preview watermarks.
- Uploads validate MIME type and size before sending. Limits match backend defaults: 2 MB previews, 15 MB production PNG, 20 MB PDF. Progress and individual retry are shown. Successful uploads are reused across retries.
- Cart storage excludes original image blobs/data URLs. Existing legacy cart lines without a SKU are rejected at checkout with instructions to recreate them. Create another keepsake from the cart; finalized uploaded artwork is not reopened as an uncropped original.
- Checkout revalidates aggregate quantities, updates catalogue prices, reviews customer/shipping details, and sends only backend order fields. Discounts are confirmed by the backend.
- Payment initialization failures retain the existing order. Verification, not the redirect, confirms payment. Only cart lines associated with the verified order are removed.
- Checkout saves a UUID checkoutKey and exact request before submission. A lost response can be retried with that same key and payload. Payment retries reuse the existing order. Session recovery is limited to the current browser tab.
- Tracking displays only returned customer-safe fields; it does not fabricate individual prices, readiness dates or hidden customer details.

## Backend gaps requiring follow-up

1. **Personalized phone cases:** remain disabled in the frontend. The current public API exposes package prices, and adjacent backend source accepts photo references. Integrate and test those newer contracts before enabling the package; Case Only uses live model SKUs and prices.
2. **Shipping:** `POST /orders` currently charges the state delivery rate even with a courier selection. The UI therefore presents courier prices as quotes/preferences and uses the configured state fee for its estimate. Exact opaque courier identifiers are preserved. The backend must change if the selected courier quote should determine the charge.
3. **Order recovery:** server-side checkout keys are supported and used. Recovery after a lost browser session still requires a customer-facing mechanism; current recovery uses sessionStorage.
4. **Artwork dimensions:** the existing template sizes and Polaroid frame geometry are used. A physical print proof is still needed before launch; the API does not specify production trim, bleed or resolution requirements.

## Validation

- `npm test`: Node tests with mocked HTTP for parsing/errors, aborts, multipart validation/retry, stock aggregation, all category payloads, payment requests and tracking empty results.
- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`.
- `npm run test:e2e`: Playwright against a production build, with all backend calls intercepted. `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` uses an existing Chrome installation; otherwise run `npx playwright install chromium` first.

See `docs/QA-AUDIT.md` for the latest verification and remaining release checks. Browser coverage includes real PNG/PDF generation and an individually retried upload. No live payment was attempted.

The production build needs access to Google Fonts because the original UI uses `next/font/google`. Automated tests do not call the deployed backend or Paystack.

### Payment popup and order lookup

Checkout opens the Paystack v2 InlineJS popup with the access code returned by the backend. Popup completion triggers backend verification; only a verified PAID response displays the success modal and clears the matching order's cart lines. Cancellation leaves the unpaid order available to resume. Older `/payments/callback` links redirect to `/checkout?paymentReference=…` and use the same modal. See Paystack's official [InlineJS documentation](https://paystack.com/docs/developer-tools/inlinejs/).

PBS order numbers and secure tracking tokens are different identifiers. The current tracking API only looks up a token directly. The UI resolves a PBS number by searching the checkout phone's paid orders and matching the number, then navigates using the returned secure token. Direct tracking links/tokens retain their original casing. Number-only lookup across devices would require a new backend contract; this frontend does not expose the protected admin order-search endpoint.

Polaroid production PNGs contain only the cropped photo, without the decorative frame. The separate preview and cart thumbnail retain the frame. Existing uploaded order files are unchanged. Photostrips support multi-file selection and direct adjustment by tapping a photo in the strip preview. Cart thumbnails are stored locally at reduced resolution so they remain visible after refreshing.

Event enquiries: `/polaroid-station` is linked from the homepage, header and footer. Its form prepares a WhatsApp message to the existing business number; the visitor must send the message. It does not create an order, reserve a date or take payment. Event availability, pricing and booking terms are agreed with the owner directly.

Local draft recovery: Polaroid and photostrip editors keep original photo blobs and crop/design settings in IndexedDB on the current browser. Drafts older than 24 hours are rejected and removed when that editor next loads; this is not a server photo-retention policy or a background deletion guarantee. Successful add-to-cart clears the draft. Clear draft resets the editor and stored design. Storage failures show a warning and do not prevent ordering. Cart-item editing is excluded. Other product editors do not yet have draft recovery.

Contextual WhatsApp help is available on product, cart, checkout and tracking pages. It prepares product/cart context or the public order number; it does not send messages automatically or include photo URLs, addresses, email addresses or private tracking tokens.

Gallery albums and customer photo reviews: public `/gallery`, `/gallery/[slug]`, `/reviews`; admin `/admin/gallery` and `/admin/reviews`. These screens use the new backend contracts specified in `docs/BACKEND-GALLERY-REVIEWS-PROMPT.md`. Real upload/publishing/moderation requires those endpoints to be deployed. Existing static gallery files remain a homepage fallback if the featured API is unavailable. A successful empty feed does not display fallback albums. The old hard-coded testimonials have been replaced by published reviews; missing APIs show honest empty/error states. Customer review photos require explicit website-publication consent and submissions return PENDING for admin moderation.

# Studio admin

The admin lives at `/admin` in this existing Next.js frontend; sign in at `/admin/login`. The customer shell is replaced with a dedicated admin shell on these routes. Styling follows the supplied cream paper/burgundy designs and the site's existing fonts. Navigation becomes a mobile menu, tables become cards and forms stack on small screens.

## Routes and API coverage

All API paths below are relative to `NEXT_PUBLIC_API_URL` (including `/api`). Requests use the live contract snapshot in `src/lib/admin/schema.json`; request DTOs are in `src/lib/admin/dto.ts`.

| Admin route | API integration |
| --- | --- |
| `/admin/login` | POST `/auth/admin/login`, GET `/auth/admin/me` |
| `/admin` | GET `/dashboard/summary`, `/dashboard/monthly-profit`, `/dashboard/products`, `/dashboard/sources`, recent `/orders` |
| `/admin/orders` | GET `/orders` with pagination, search, source, status, payment status and date filters |
| `/admin/orders/new` | GET products, delivery rates, customer search; POST `/orders/manual` |
| `/admin/orders/:id` | GET order; PATCH status, admin-note, tracking, delivery-cost, item fulfillment; POST manual-payment, cancel, shipment/retry |
| `/admin/customers[/:id]` | GET list/detail, PATCH `/:id/archive` |
| `/admin/products[/:id]` | GET, POST, PATCH, DELETE (soft disable) `/products` |
| `/admin/variants[/:id]` | GET, POST, PATCH, DELETE (soft disable) `/variants`; product selector |
| `/admin/inventory[/:id]` | GET, POST, PATCH, DELETE (soft disable) `/resources`; POST `/:id/restock`; stock movement history |
| `/admin/resource-rules[/:id]` | GET, POST, PATCH, DELETE `/resource-rules`; variant/resource selectors |
| `/admin/suppliers[/:id]` | GET, POST, PATCH, DELETE (soft disable) `/suppliers` |
| `/admin/purchases[/:id]`, `/admin/purchases/new` | GET/POST `/purchases`; supplier/resource selectors and base-unit conversion review |
| `/admin/delivery-rates` | GET/POST `/delivery-rates`; PATCH/DELETE wired for records with IDs, currently absent from list responses |
| `/admin/discounts[/:id]` | GET, POST, PATCH, DELETE (soft disable) `/discounts` |
| `/admin/payments[/:id]` | GET `/payments` list/detail; record manual receipts through the associated order |
| `/admin/expenses[/:id]` | GET, POST, PATCH, DELETE `/expenses`; GET `/expenses/summary` |
| `/admin/withdrawals[/:id]` | GET, POST, PATCH, DELETE `/owner-withdrawals`; GET `/owner-withdrawals/summary` |
| `/admin/settings` | Session account details and a persistent reminder to revisit backend fixes |

Production files use the existing multipart `/uploads` helper and purpose validation. The admin displays/downloads stored references and permits replacing supported files, not editing original photo/crop projects. Phone-case fulfillment supports the deployed package field; extra artwork depends on the backend follow-up.

## Implementation

- `src/app/admin`: routing, metadata and responsive styles.
- `src/component/admin`: authenticated shell, dashboard, list/detail screens, manual order/purchase flows and reusable forms/dialogs/tables.
- `src/lib/admin`: centralized bearer client, session management, typed requests, schema-based validation and shared data helpers.
- `StorefrontFrame.tsx` keeps the storefront header/footer out of admin pages.
- Auth tokens are kept in memory plus sessionStorage, never URLs or permanent localStorage. `/me` validates restored sessions before protected children mount. 401/logout clears the session and unmounts private screens. The API remains responsible for authorization; this UI is not a substitute for server guards.
- Forms whitelist request fields, show backend validation errors, block duplicate submission and confirm consequential actions. Long forms warn on browser unload. Purchase conversions are reviewed explicitly; final order totals/profit/stock come from the backend.
- No admin credentials or backend secrets are included.

## Known limits

See [BACKEND-FOLLOWUPS.md](./BACKEND-FOLLOWUPS.md). Delivery-rate IDs, inactive catalogue access and unsupported deadline/booking actions are explicit limitations. Schema snapshots describe deployed endpoints; newer local backend work must be deployed and contracts rechecked before enabling new actions.

## Run and deploy

1. Install dependencies: `npm ci`.
2. Set `NEXT_PUBLIC_API_URL=https://polaroidsbysolly-be.onrender.com/api` in `.env.local` or the hosting build environment. This public value contains no secret. Existing `NEXT_PUBLIC_PAYSTACK_TEST_MODE` remains a customer-checkout setting, not admin authentication.
3. For local use run `npm run dev`, then visit `http://localhost:3000/admin/login` and use an existing backend admin account.
4. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Builds need access to the existing Google Fonts URLs.
5. Run mocked browser checks with `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` when Google Chrome is installed; otherwise install Playwright Chromium and run `npm run test:e2e`. Tests launch the production server on port 3100 and intercept every API request.
6. Deploy as a Next.js Node application (not a static export): build command `npm run build`, start command `npm start`, or use the hosting provider's Next.js preset. Set the API URL before the build.
7. Allow the deployed frontend origin in backend CORS, including Authorization preflights. Test login on the deployed URL and complete a controlled staging workflow before production use.

Validation covers auth/error/expiry/restoration, filters, low-stock/overview states, 360px mobile navigation/detail/dialogs, manual order payloads, duplicate-safe manual receipts, status updates, both cancellation restoration choices, restock, catalogue forms, purchase conversion, expenses/withdrawals and customer storefront regressions. Browser tests use fixtures; real admin credentials were not provided and no live order/payment/inventory mutations were performed.

## Inventory usability

Inventory now uses an **Add stock** flow. The dropdown lists existing supply names with their real resource SKUs; choosing one calls its restock endpoint instead of creating a duplicate. A new item gets a suggested unique `SUP-…` code from its name, with an optional override. The owner enters quantity and total purchase cost; the form calculates the per-unit cost required by the API. Units and categories have guided choices, and the stock-code/low-stock fields are tucked under optional settings. Product-option SKUs are not silently linked to inventory: consumption remains configured through Supplies per product.

Inventory and purchases are in the everyday navigation. Less-used catalogue/configuration pages are grouped under expandable **Shop setup**; Variants is labelled **Product options**, and Usage rules is labelled **Supplies per product**.

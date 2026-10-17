# Storefront content

## Gallery

The public gallery is built from `public/images/gallery/`. See that folder's README for album folders and naming rules. Run `npm run gallery:generate` after adding/removing images while the dev server is already running. Generation also runs before dev/build. Commit the photos and `src/data/gallery.generated.json`; push to deploy.

Use `product-showcase/vintage-letters-*.jpg` for photos shared between the showcase and Vintage Letters mini gallery. Other category prefixes are `polaroids-`, `photostrips-`, `phone-cases-`, and `albums-`. Images are served by the frontend. Admin Gallery now explains this workflow rather than uploading to storage.

## Reviews

Customer quotes supplied by Solly are in `src/data/customer-reviews.ts`. These quotes have no invented rating or verified-purchase badge. Customer-submitted reviews/photos continue through the backend moderation flow and appear alongside them. Keep names/quotes accurate and publish feedback with the customer's permission.

## Packages

Edit display content in `src/data/packages.json`. Matching authoritative contents and prices live in the backend repository at `src/orders/packages.catalogue.ts`; update both together when changing offers. The final requested list is used: You and Me costs NGN 21,000; Moments with You has no photostrips.

Customers customise the individual products, return to the package page, and select exactly the included quantities. Completing the package groups those cart items at the fixed package price. Quantities are locked; removing a component removes that package. The backend checks all package contents and stock using the physical product variants. No stock is created by this feature.

Package phone cases use Case Only because custom Polaroid prints are already included. The Ultimate Birthday Gift's free mini photostrip reuses its full-size strip design; fulfillment is flagged in the admin order details.

## Protective packaging

Regular orders can select premium protective packaging at NGN 1,500 per order. Gift packages include it without another fee. The backend calculates and persists the charge and selection; the admin order summary shows both. The fee does not create stock or represent the actual packaging cost, which remains part of your normal inventory/accounting setup.

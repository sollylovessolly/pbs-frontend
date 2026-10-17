# Storefront content

## Gallery

The public gallery is built from `public/images/gallery/`. See that folder's README for album folders and naming rules. Run `npm run gallery:generate` after adding/removing images while the dev server is already running. Generation also runs before dev/build. Commit the photos and `src/data/gallery.generated.json`; push to deploy.

Use `product-showcase/vintage-letters-*.jpg` for photos shared between the showcase and Vintage Letters mini gallery. Other category prefixes are `polaroids-`, `photostrips-`, `phone-cases-`, and `albums-`. Images are served by the frontend. Admin Gallery now explains this workflow rather than uploading to storage.

## Reviews

Customer quotes supplied by Solly are in `src/data/customer-reviews.ts`. These quotes have no invented rating or verified-purchase badge. Customer-submitted reviews/photos continue through the backend moderation flow and appear alongside them. Keep names/quotes accurate and publish feedback with the customer's permission.

## Packages

Edit display content in `src/data/packages.json`. Matching authoritative contents and prices live in the backend repository at `src/orders/packages.catalogue.ts`; update both together when changing offers. The final requested list is used: You and Me costs NGN 21,000; Moments with You has no photostrips.

Customers start a package draft, then customise each component with the remaining package quota. Saving each component returns to the package page and updates progress. Draft components persist in the existing local cart storage with package-draft metadata but stay separate from the purchasable cart and checkout. Only a complete package enters the cart at its fixed price. A cart resume link and the package page restore progress after navigation or refresh. Completed steps can be replaced. The optional “Use keepsakes already in your cart” section supports older cart items.

Once bundled, quantities are locked; removing a component removes that package. The backend still checks all package contents and stock using the physical product variants. No stock is created by this feature. Package-specific photo draft keys prevent unrelated Polaroid/photostrip drafts from leaking between packages or standalone customisers.

Package phone cases use Case Only because custom Polaroid prints are already included. The Ultimate Birthday Gift's free mini photostrip reuses its full-size strip design; fulfillment is flagged in the admin order details.

Package cards, the homepage bestsellers and package detail pages use the existing product photos as a collage. To add dedicated package photos later, put them in `public/images/packages/` and add their paths by package ID in `src/data/package-images.ts` (for example, `"you-and-me": "/images/packages/you-and-me.jpg"`).

## Protective packaging

Regular orders can select premium protective packaging at NGN 1,500 per order. Gift packages include it without another fee. The backend calculates and persists the charge and selection; the admin order summary shows both. The fee does not create stock or represent the actual packaging cost, which remains part of your normal inventory/accounting setup.

## Product navigation and review approval

Products opens on the Packages category; All shows packages first followed by individual products. Polaroid, photostrip and vintage-letter product previews use the supplied Product Showcase images.

New customer reviews stay pending. In `/admin/reviews`, use Publish review to approve them for the public reviews page and homepage preview. Only published reviews with publication consent are returned by the public API. The public reviews refresh when the browser tab regains focus. Public review cards consistently use burgundy and cream without pill badges.

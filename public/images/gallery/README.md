# Repo-managed gallery

Add photos to these folders, then run `npm run gallery:generate` (also runs automatically before `npm run dev` and `npm run build`):

- `product-showcase/` → Product Showcase
- `oriya-living/` → Oriya Living
- `aoo-50/` → AOO@50
- `blazing-wheels/` → Blazing Wheels
- `gtco-fashion-weekend/` → GTCO Fashion Weekend (`gt` photos)
- `covenant-university-thanksgiving/` → Covenant University Thanksgiving (`tg` photos)
- `my-first-photobooth/` → My First Photobooth (`booth` photos)

Use JPG, PNG, WebP or AVIF. Prefer compressed WebP/JPEG under 500 KB. Add an optional `cover.jpg` to choose an album cover; otherwise the first filename is used. Empty albums remain visible without pretend event photos.

In Product Showcase, start filenames with a product category so they also appear in that product’s mini gallery:

- `vintage-letters-amber.jpg`
- `polaroids-birthday.jpg`
- `photostrips-classic.jpg`
- `phone-cases-iphone.jpg`
- `albums-memories.jpg`

Other filenames appear only in the main album. Captions are derived from filenames. Adjust caption/alt generation in `scripts/generate-gallery.mjs` if needed. Commit photos and the generated `src/data/gallery.generated.json`, then push to deploy. These photos are served from the frontend; no backend storage uploads are used.

The booking page hero is stored separately at `public/images/station/booking-hero.jpeg`.

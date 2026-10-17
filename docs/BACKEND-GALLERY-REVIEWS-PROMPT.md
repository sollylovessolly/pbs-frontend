# Backend handoff: gallery albums and customer photo reviews

Copy the prompt below into the coding agent working in the BACKEND repository.

---

You are working inside the existing PolaroidsBySolly backend repository. Implement the features below fully, following the project's AGENTS.md, existing framework, ORM, authentication, storage and testing conventions. Inspect the repository before editing. Do not replace working commerce logic. Deliver code, migrations, API documentation and tests—not just a plan.

The CUSTOMER/ADMIN FRONTEND is already implemented against this exact contract. API base currently ends in `/api`. All routes below are relative to that base. Do not add a second `/api`. Do not silently change route names, enum values, payload fields or response wrappers.

## 1. Business requirements

### Gallery
The owner offers both personalised prints and event Polaroid stations. They need named albums such as GTCO Event, Playball Africa, Station Setups and Prints & Keepsakes. These names are examples, NOT seed data.

Admin can create/edit/delete albums, upload multiple photos, choose a cover, change photo order, add optional captions and accessible descriptions, select homepage photos, and save as draft or publish. Publishing requires confirmation of permission to publish all photos. Drafts must never appear in public APIs or publicly accessible media.

Customers see album covers, titles and photo counts, open an album, then enlarge individual photos and read captions. The homepage displays selected photos linking to their albums.

### Reviews
Customers can submit a display name, rating, honest written review and up to three optional photos. Their phone and optional order number are private. Reviews always start PENDING. The owner can publish, unpublish, reject with a reason, or delete through admin. Only published, consented reviews appear publicly and on the homepage.

Publication permission covers the review, display name and attached photos on this website only. It does not authorize social-media or advertising reuse. Do not import customer production photos into the gallery or reviews. Do not seed fictional reviews, star ratings, permission records or events. Do not suppress genuine negative ratings.

Preserve checkout, Paystack, order production uploads, inventory, tracking and existing admin sessions. Do not deploy, run destructive production migrations, contact customers or delete existing production files without separate authorization.

## 2. Frontend reference files

- `src/lib/gallery/types.ts`: shared gallery types.
- `src/component/gallery/AlbumGallery.tsx`: public albums, pagination and lightbox.
- `src/component/home/Gallery.tsx`: featured photos; existing local gallery is a fallback only when its API request fails.
- `src/component/admin/GalleryAdmin.tsx`: album management and uploads.
- `src/lib/reviews/types.ts`: review types.
- `src/component/reviews/Reviews.tsx`: public list and multipart submission.
- `src/component/reviews/ReviewCards.tsx`: public review cards.
- `src/component/admin/ReviewsAdmin.tsx`: moderation.
- `src/lib/admin/api.ts`: bearer-authenticated requests, now supports FormData.

Frontend routes: `/gallery`, `/gallery/:slug`, `/reviews`, `/admin/gallery`, `/admin/gallery/new`, `/admin/gallery/:id`, `/admin/reviews`.

## 3. Shared API rules

Use existing JWT/admin authentication. Every `/admin/gallery/*` and `/admin/reviews*` route must enforce authentication and appropriate permissions on the server, including read/upload routes. The frontend sends `Authorization: Bearer <accessToken>`.

JSON response bodies must match the shapes below directly. Do not wrap a single response in `{ data: ... }`. Lists use this specific pagination envelope:

```json
{ "data": [], "pagination": { "page": 1, "limit": 12, "total": 0, "totalPages": 0 } }
```

Page is 1-based. Empty totalPages=0 is allowed. Validate positive integer page/limit. Lists are deterministic (createdAt descending, stable ID tie-break). Public counts exclude unpublished rows. Default/max limits specified below.

Errors: `{ "message": "Safe, actionable explanation", "code": "OPTIONAL_CODE" }` with correct HTTP status. Use400 validation,401 authentication,403 authorization,404 unavailable,409 concurrency/idempotency conflict,413 size,415 media type,429 rate limit (Retry-After),503 dependency outage. Never expose stack traces, SQL, secret keys, phone/order existence or private data in public errors.

All text is plain text, trimmed and length-bounded. IDs are opaque strings. Dates are UTC ISO8601. Unknown privileged fields must be rejected. Configure existing CORS to allow authorized frontend origins, Authorization and multipart boundaries. Never force JSON Content-Type on multipart.

## 4. Gallery data model

Adapt names to the existing ORM. Use safe additive migrations.

GalleryAlbum:
- id, unique stable slug, title (1–120), description (0–2000).
- status enum DRAFT/PUBLISHED, default DRAFT.
- coverPhotoId nullable, must belong to the album's submitted photo list.
- version integer starting1, incremented atomically with every update.
- permissionConfirmed boolean, with server-recorded actor/time and publishing audit history.
- createdAt/updatedAt, createdBy/updatedBy admin IDs; publishedAt if needed for ordering.
- max100 photos, with unique explicit sortOrder.

GalleryPhoto/GalleryUpload:
- id, isolated asset purpose GALLERY, full and thumbnail storage keys, decoded MIME, byte size, width/height.
- caption and alt each0–300, featured boolean defaultfalse.
- uploader/admin/studio ownership, createdAt, nullable albumId until attached, sortOrder.
- idempotent upload requestKey and content fingerprint.

Generate slug once from title plus collision-safe suffix; subsequent title changes keep existing links stable. Handle unicode and punctuation safely. Avoid shared asset ownership between albums; if deduplicating physical bytes, reference-count internally.

### GalleryPhoto response

```json
{
  "id": "photo-id",
  "url": "https://media.example/full.jpg",
  "thumbnailUrl": "https://media.example/thumb.jpg",
  "width": 1600,
  "height": 1200,
  "caption": "Guests at the station",
  "alt": "Guests holding their prints beside the station",
  "featured": false
}
```

URLs must be real absolute HTTPS URLs. Admin draft URLs must be short-lived, authorized signed URLs usable directly by browser img elements; those cannot add bearer headers. Never return permanent public draft originals.

### Full admin GalleryAlbum response

```json
{
  "id": "album-id",
  "slug": "gtco-event",
  "title": "GTCO Event",
  "description": "Our station at the event.",
  "status": "DRAFT",
  "version": 1,
  "permissionConfirmed": false,
  "coverPhotoId": null,
  "photos": [],
  "updatedAt": "2026-09-22T10:00:00.000Z"
}
```

Photos are GalleryPhoto objects in saved display order. coverPhotoId must reference a submitted photo or be null; publishing requires a non-null valid cover.

### AlbumSummary response

```json
{
  "id": "album-id",
  "slug": "gtco-event",
  "title": "GTCO Event",
  "description": "Our station at the event.",
  "status": "DRAFT",
  "photoCount": 12,
  "cover": null
}
```

cover is GalleryPhoto|null. status is included only for admin summaries; public summaries omit it.

## 5. Gallery endpoints

### GET /gallery/albums?page=1&limit=12
Public paginated AlbumSummary, PUBLISHED and permission-confirmed albums only. Default12/max50. Do not expose draft count, draft cover or draft URLs.

### GET /gallery/albums/:slug
Public only. Return `{ id, slug, title, description, coverPhotoId, photos, updatedAt }`, photos in saved order, max100. The frontend shared TS type contains admin fields but public rendering does not require them: omit permission audit, version and status. Draft/deleted/unknown albums all404, indistinguishable safe error.

### GET /gallery/featured?limit=12
Plain array (not envelope). Each GalleryPhoto additionally includes `albumSlug` and `albumTitle`. Only featured=true photos from published permission-confirmed albums. Default/max12. Order newest published album first, then saved photo order, stable ID tie-break. Return[] if none; do not invent rows or return drafts. Homepage treats empty success as no featured photos.

### GET /admin/gallery/albums?page=1&limit=20
Authenticated list including drafts and published albums, paginated AlbumSummary with status. Default20/max50.

### GET /admin/gallery/albums/:id
Authenticated full GalleryAlbum with usable private preview URLs.

### POST /admin/gallery/uploads
Authenticated multipart: exactly one `file`, and UUID `requestKey`.

Frontend loops over the user's multi-file selection, one request per photo; successful files remain in the editor if another upload fails. Retry reuses that file's requestKey.

Allow JPEG/PNG/WebP, <=10MiB/file. Verify magic bytes AND decode. Reject SVG/HTML/GIF/HEIC and animation unless consciously implemented with frontend updates. Bound decoded dimensions/pixel count (e.g.40MP) against decompression bombs. Apply EXIF orientation to pixels, strip metadata including GPS, create full-size (e.g.max2000px) and thumbnail (e.g.max600px) derivatives without upscaling. Sanitize names and generate random storage keys. Return201 GalleryPhoto, caption/alt empty, featured=false.

Idempotency: same admin/studio+requestKey+file bytes returns same photo, no duplicate object. Same key with different content409. Coordinate concurrent retries. Never reuse customer production upload purpose. Roll back/clean partial storage writes on failure; report storage outage honestly. Protect unlinked uploads until publication.

### POST /admin/gallery/albums
Authenticated JSON:

```json
{
  "requestKey": "client-uuid",
  "title": "GTCO Event",
  "description": "Our station at the event.",
  "status": "DRAFT",
  "permissionConfirmed": false,
  "coverPhotoId": "photo-id",
  "photos": [{ "id": "photo-id", "caption": "The setup", "alt": "The Polaroid station", "featured": true }]
}
```

201 full GalleryAlbum. Empty drafts allowed; empty album cover must be null. Photos reference uploads issued by this API—not arbitrary URLs, storage keys, order asset IDs or photos belonging to another album. Validate ownership/purpose/expiry, duplicates and max100. Array order defines display order.

Publishing requires >=1 photo, valid cover, permissionConfirmed=true. Record authenticated actor/time server-side; reject client audit fields.

Create idempotency is required: same scoped requestKey and payload returns the original album after a lost response, not another album. Hash normalized semantic body. Same committed key/different payload409. Validation failures must not permanently consume a key. Retain idempotency records at least24h.

### PATCH /admin/gallery/albums/:id
Same fields as create EXCEPT `expectedVersion` integer instead of requestKey. Complete desired-state save, including COMPLETE photo list:
- attach new upload IDs;
- remove omitted old photo IDs;
- update caption/alt/featured;
- use array order;
- update title/description/visibility/cover/permission atomically.

Compare expectedVersion to current version atomically. Stale409 with no changes. Increment once, return full GalleryAlbum. Reject all invalid references before mutation. New photo publication requires explicit permission; frontend resets the checkbox when adding photos, backend still validates.

Unpublishing removes album and featured photos from all public endpoints immediately. Remove/revoke media access and invalidate relevant caches. Do not delete physical media during the DB transaction; queue cleanup after commit and reference-check it. Never delete another album/order/review's assets.

### DELETE /admin/gallery/albums/:id
Authenticated JSON `{ "expectedVersion": 2 }`. Version check, delete/unpublish atomically, remove public/media access, queue cleanup, record audit.204. A retry after successful deletion can return204. Do not affect commerce assets.

## 6. Review data model

Review fields:
- id, displayName1–80, integer rating1–5, text10–2000.
- required private normalized phone; optional private orderNumber<=100, empty becomes null.
- status PENDING/PUBLISHED/REJECTED, always PENDING on public create.
- verifiedPurchase SERVER-OWNED. Typing an order number or approving moderation does not establish verification. Only set true using trustworthy existing authenticated/secure order ownership evidence; if unavailable, leave false. Do not invent an incompatible OTP requirement.
- publicationConsent=true required, consentVersion=`review-publication-v1`, server consentedAt; website publication only.
- version starts1; moderationReason nullable<=1000, moderator/time, createdAt/updatedAt, audit history.
- requestKey/fingerprint for atomic idempotent submission.
-0–3 REVIEW-purpose photos, each<=5MiB, private until published; sanitized derivatives and stripped metadata like gallery files.

Public Review DTO:

```json
{
  "id": "review-id",
  "displayName": "Ada O.",
  "rating": 5,
  "text": "My prints came out beautifully.",
  "createdAt": "2026-09-22T10:00:00.000Z",
  "verifiedPurchase": false,
  "photos": [{ "id": "review-photo-id", "url": "https://media.example/full.jpg", "thumbnailUrl": "https://media.example/thumb.jpg" }]
}
```

Never expose phone, orderNumber, consent logs, moderation notes, storage keys or private status in public DTOs.

AdminReview is the above PLUS `status`, `version`, `phone`, `orderNumber` string|null, `publicationConsent` boolean, `moderationReason` string|null. Private pending/rejected photo URLs must be signed and short-lived.

## 7. Review endpoints

### GET /reviews?page=1&limit=12
Public paginated Review DTO, PUBLISHED+consented only. Newest first with stable tie-break. Allow limit3 for homepage, default12/max50. Real empty[] if none. No fake examples, invented counts or excluding negative ratings. Private rows excluded from total.

### POST /reviews
Public multipart form, fields EXACTLY:
- `displayName`, `rating` (string integer1–5), `text`, required `phone`.
- `orderNumber` optional/empty permitted: event customers may have no order number.
- `publicationConsent`: literal `"true"`.
- `consentVersion`: `review-publication-v1`.
- `requestKey`: UUID.
- `photos`: repeated file field, zero to three JPEG/PNG/WebP files, <=5MiB each.

201 response `{ "id": "review-id", "status": "PENDING" }`. No media URLs/private details in receipt. Never immediately publish. Reject injected status/verifiedPurchase/admin fields or remote photo URLs. Validate consent server-side.

Atomic logical submission: all files+review succeed or return failure without a partially visible review. Cleanup temporary files on failure. Repeated same-key/same-content requests return same receipt and one review, even after lost response. Hash normalized field values+file bytes, not multipart boundaries. Same committed key/different content409. Persist keys>=24h. Never disclose unrelated users' review details. Replay original PENDING receipt even if moderation changed later.

Normalize phone using existing Nigerian/international handling. Do not expose whether a supplied order exists or matches a phone. An order reference is not authentication. Allow reviews with no order; moderate them normally, verifiedPurchase=false.

Rate-limit by reliable client/IP strategy; do not trust arbitrary forwarded headers. Limit requests, bytes and simultaneous image processing. Body limit slightly above15MiB for multipart overhead, timeouts,429+Retry-After. Add reasonable duplicate/spam checks. If CAPTCHA is necessary, document required frontend integration rather than silently rejecting every current submission. No automatic WhatsApp/SMS/email sending is requested.

### GET /admin/reviews?status=PENDING&page=1&limit=20
Authenticated paginated AdminReview. Filter enum PENDING/PUBLISHED/REJECTED. DefaultPENDING, limit20/max50. Only authorized admins can see private contacts/unpublished images.

### PATCH /admin/reviews/:id
Authenticated JSON:

```json
{ "expectedVersion": 1, "status": "PUBLISHED", "moderationReason": null }
```

Allowed transitions among all three statuses. PUBLISHED requires consent; REJECTED requires nonempty reason<=1000. Atomically compare version, reject stale409, increment and return full AdminReview200. Record actor/time/prior status/new status/reason. Do not allow editing customer rating/text/name/photos/contact or verifiedPurchase via moderation. Low ratings can be published equally. Unpublish/reject removes public row and revokes media/cache access.

### DELETE /admin/reviews/:id
Authenticated JSON `{ "expectedVersion": 2 }`. Version check; remove public access and review/photo references, queue isolated file cleanup,204. Minimal appropriate audit without indefinitely retaining deleted pictures/private content. This supports owner-handled consent withdrawal/deletion requests via support; verify the requester using existing support practices.

## 8. Privacy, storage and operations

- Separate GALLERY/REVIEW storage ownership from ORDER assets. Never move production photos into these features automatically.
- Buckets must not expose draft/pending files to the public by default. No public original URL simply because a file uploaded successfully.
- Use controlled media delivery/publication checks or revocable public derivatives. Admin signed URLs have short TTL; document unavoidable expiry windows. Do not falsely claim immediate revocation if storage cannot guarantee it.
- Public cache invalidation on publish/unpublish/delete; avoid serving removed content from a stale feed/CDN. Admin private/no-store. Document bounded residual cache windows.
- Unlinked gallery uploads expire after24h and are cleaned by a real scheduled job. Linked drafts remain until owner removes them. Clean failed review temp uploads. Pending-review retention needs an explicit documented configuration/owner policy, not an invented promise.
- Physical delete jobs must reference-check isolated assets, retry safely and log operational errors without secrets/private photos. Delete metadata only after appropriate commit/outbox design; don't hold DB transactions open during storage transfers.
- Validate decoded image bytes, dimensions and pixel count; metadata removal; no path traversal, SSRF or client-specified remote fetching. Bound processing concurrency. No SVG/script delivery through image routes.
- Idempotency/concurrency tests must cover overlapping uploads, saves, moderation and deletion. Security cannot rely on disabled frontend controls.

## 9. Required acceptance tests

Use existing backend test stack and real service/integration tests in an isolated test DB/storage adapter:

1. All admin reads/writes/uploads protected:401/403 and valid JWT behavior; existing login unaffected.
2. Draft save without photos works, publish without photo/cover/consent fails. No draft data/count/URLs in public list/detail/featured.
3. Upload and create idempotency including simultaneous retries, lost responses, mismatched-content409 and validation failures not consuming keys.
4. Album complete-state PATCH ordering/metadata/removal/attachment atomic; bad cover, duplicate IDs, foreign assets/purposes, expired uploads, stale version rejected without partial writes.
5. Unpublish/delete removes gallery and featured entries/media; does not affect other albums or orders. Cleanup failures retry safely.
6. Pagination bounds/stable totals, slug collisions, title changes preserve links.
7. Valid JPEG/PNG/WebP derivatives; EXIF orientation preserved visually, GPS stripped; corrupt/oversize/unsupported/animated/decompression-bomb uploads rejected. Private files not public.
8. Reviews accept0/1/3 images, reject4/oversize, invalid text/rating/phone/consent/privilege injection. Event customer without order can submit.
9. Submission always pending; no public/private-URL leak in receipt; one review on retry; partial failures cleaned; rate limiting429 and safe generic order errors.
10. Moderation CAS, consent enforcement, audit, publish low ratings, no editing customer testimony through moderation. Verified flag server-controlled.
11. Public review DTO excludes phone/order/moderation data; unpublish/delete hides photos as well as text; cache revocation behavior tested.
12. Orphan job removes only eligible unlinked assets; no deletion of customer production media.
13. Existing commerce/payment/inventory/upload/auth regression suite remains green.
14. Smoke-test exact frontend request/response contracts, including empty404/503 states, malformed multipart, expired admin sessions and real thumbnail loading.

## 10. Deliverables and rollout

Deliver working routes, services, DTOs, models, non-destructive migrations, tests and OpenAPI docs (multipart included). Document env VARIABLE NAMES only, never secret values. Explain storage access policy, media delivery, cleanup scheduler, TTL/cache behavior, concurrency and recovery.

Report test commands/results, endpoints completed, intentional differences requiring frontend updates, and real limitations. Do not claim success with mocks alone when backend behavior is unimplemented.

Propose deployment order: additive migration, storage/privacy/CORS configuration, API deploy, admin upload/publish smoke test, public visibility check, review submission/moderation smoke test, then frontend production check. Do not execute production deployment without authorization.

The frontend is ready for this contract but cannot actually store/publish/moderate until these endpoints are deployed. No customer messages or real fake reviews should be sent/seeded as part of testing.

## Owner clarification — 23 September 2026

Event publicity is different from private print uploads: the owner may share station setups and event highlights unless the booking customer requests that the event not be featured, subject to applicable publication rights and any required guest permissions. The privacy policy explains this distinction. Do not interpret organiser silence as blanket consent for every attendee or for private order artwork. Preserve the admin publication-rights check and review submitter's separate website-only opt-in. When an event opt-out/removal request is received, the owner must be able to unpublish the album and revoke its public media access. Future booking storage should record the publicity preference and its provenance; the current event enquiry is WhatsApp-based and does not yet save booking records.

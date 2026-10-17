import fs from "node:fs";
import path from "node:path";
const root = path.resolve("public/images/gallery");
const albums = [
  [
    "product-showcase",
    "Product Showcase",
    "Our prints, letters, cases and other keepsakes.",
  ],
  ["oriya-living", "Oriya Living", "Memories from Oriya Living."],
  ["aoo-50", "AOO@50", "A celebration worth keeping."],
  ["blazing-wheels", "Blazing Wheels", "Moments from Blazing Wheels."],
  [
    "gtco-fashion-weekend",
    "GTCO Fashion Weekend",
    "Instant memories from GTCO Fashion Weekend.",
  ],
  [
    "covenant-university-thanksgiving",
    "Covenant University Thanksgiving",
    "Thanksgiving moments, printed to keep.",
  ],
  [
    "my-first-photobooth",
    "My First Photobooth",
    "Where the photobooth memories began.",
  ],
];
const categories = [
  "vintage-letters",
  "polaroids",
  "photostrips",
  "phone-cases",
  "albums",
];
const result = albums.map(([slug, title, description]) => {
  const dir = path.join(root, slug);
  fs.mkdirSync(dir, { recursive: true });
  const files = fs
    .readdirSync(dir)
    .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const photos = files.map((name, index) => {
    const category =
      slug === "product-showcase"
        ? (categories.find((tag) => name.startsWith(tag + "-")) ?? null)
        : null;
    const filenameCaption = name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const caption =
      slug === "product-showcase"
        ? filenameCaption
        : `${title} · Photo ${index + 1}`;
    const url = `/images/gallery/${slug}/${encodeURIComponent(name)}`;
    return {
      id: `${slug}/${name}`,
      url,
      thumbnailUrl: url,
      width: 1200,
      height: 1200,
      caption,
      alt: `${title}: ${caption}`,
      featured: name !== "cover.jpg",
      category,
    };
  });
  const cover =
    photos.find((photo) => /\/cover\./i.test(photo.url)) ?? photos[0] ?? null;
  return {
    id: slug,
    slug,
    title,
    description,
    status: "PUBLISHED",
    version: 1,
    permissionConfirmed: true,
    coverPhotoId: cover?.id ?? null,
    updatedAt: "",
    photos,
    cover,
    photoCount: photos.length,
  };
});
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(
  "src/data/gallery.generated.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `Gallery: ${result.length} albums, ${result.reduce((n, a) => n + a.photoCount, 0)} photos`,
);

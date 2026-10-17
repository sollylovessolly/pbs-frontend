import { test, expect, type Page } from "@playwright/test";
const admin = { id: "admin-qa", name: "Solly", email: "qa@example.com" };
const photo = {
  id: "photo-1",
  url: "/images/products/polaroids.jpg",
  thumbnailUrl: "/images/products/polaroids.jpg",
  width: 736,
  height: 981,
  caption: "The station setup",
  alt: "Prints on a table",
  featured: true,
};
const album = {
  id: "album-1",
  slug: "gtco-event",
  title: "GTCO Event",
  description: "A day of memories.",
  status: "PUBLISHED",
  version: 1,
  permissionConfirmed: true,
  coverPhotoId: photo.id,
  photos: [photo, { ...photo, id: "photo-2", caption: "The celebration" }],
  updatedAt: "2026-09-22T10:00:00.000Z",
};
const review = {
  id: "review-1",
  displayName: "Ada O.",
  rating: 3,
  text: "The prints were lovely. Delivery could have been quicker.",
  createdAt: "2026-09-22T10:00:00.000Z",
  photos: [photo],
  verifiedPurchase: false,
  status: "PENDING",
  version: 1,
  phone: "08012345678",
  orderNumber: null,
  publicationConsent: true,
  moderationReason: null,
};
const paged = (data: unknown[]) => ({
  data,
  pagination: {
    page: 1,
    limit: 20,
    total: data.length,
    totalPages: data.length ? 1 : 0,
  },
});
async function session(page: Page) {
  await page.addInitScript(
    (admin) =>
      sessionStorage.setItem(
        "pbs-admin-session-v1",
        JSON.stringify({
          accessToken: "qa-token",
          expiresAt: Date.now() + 3600000,
          admin,
        }),
      ),
    admin,
  );
}
async function setup(page: Page) {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, "");
    if (path === "/auth/admin/me") return route.fulfill({ json: admin });
    if (path === "/gallery/albums")
      return route.fulfill({
        json: paged([{ ...album, photoCount: 2, cover: photo }]),
      });
    if (path === "/gallery/albums/gtco-event")
      return route.fulfill({ json: album });
    if (path === "/reviews" && route.request().method() === "GET")
      return route.fulfill({
        json: paged([
          {
            ...review,
            status: undefined,
            phone: undefined,
            orderNumber: undefined,
          },
        ]),
      });
    return route.fulfill({ status: 404, json: { message: "Unavailable" } });
  });
}
const file = {
  name: "review.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=",
    "base64",
  ),
};

test("repo albums load without any gallery backend on mobile", async ({
  page,
}) => {
  await setup(page);
  let galleryCalls = 0;
  await page.route("**/api/gallery/**", (route) => {
    galleryCalls++;
    return route.abort();
  });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/gallery");
  for (const name of [
    "Product Showcase",
    "Oriya Living",
    "AOO@50",
    "Blazing Wheels",
    "GTCO Fashion Weekend",
    "Covenant University Thanksgiving",
    "My First Photobooth",
  ])
    await expect(
      page.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  await page.getByRole("link", { name: /Product Showcase/ }).click();
  await expect(page).toHaveURL(/\/gallery\/product-showcase$/);
  await expect(
    page.getByRole("heading", { name: "Product Showcase" }),
  ).toBeVisible();
  await page
    .locator("main button")
    .filter({ has: page.locator("img") })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("dialog")
        .locator("img")
        .evaluate((el: HTMLImageElement) => el.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole("dialog").getByRole("button", { name: /Next/ }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(galleryCalls).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
});

test("customer review photos submit privately for moderation with safe retry", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 360, height: 800 });
  let calls = 0;
  let firstKey = "";
  await page.route("**/api/reviews", (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: paged([]) });
    calls++;
    const body = route.request().postDataBuffer()!.toString();
    const key = body.match(/name="requestKey"\r\n\r\n([^\r]+)/)![1];
    expect(body).toContain('name="photos"');
    expect(body).toContain("review-publication-v1");
    expect(body).not.toContain('name="orderNumber"');
    if (calls === 1) {
      firstKey = key;
      return route.fulfill({ status: 503, json: { message: "Try again" } });
    }
    expect(key).toBe(firstKey);
    return route.fulfill({
      status: 201,
      json: { id: "review-new", status: "PENDING" },
    });
  });
  await page.goto("/reviews");
  await page.getByLabel("Display name", { exact: true }).fill("Ada O.");
  await page.getByLabel("Your rating").selectOption("3");
  await page
    .getByLabel("Your review")
    .fill("Lovely prints, though delivery could be faster.");
  await page.getByLabel("Phone number (private)").fill("08012345678");
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByAltText("Selected review photo 1")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  await expect(
    page.getByText("Your review has been submitted", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(
    page.getByText("Thank you! Your review has been submitted for approval."),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
});

test("admin can publish a lower-rated review and public cards do not show contacts", async ({
  page,
}) => {
  await session(page);
  await setup(page);
  let published = false;
  await page.route("**/api/admin/reviews**", (route) => {
    expect(route.request().headers().authorization).toBe("Bearer qa-token");
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({
        expectedVersion: 1,
        status: "PUBLISHED",
        moderationReason: null,
      });
      published = true;
      return route.fulfill({
        json: { ...review, status: "PUBLISHED", version: 2 },
      });
    }
    return route.fulfill({ json: paged(published ? [] : [review]) });
  });
  await page.goto("/admin/reviews");
  await page.getByRole("button", { name: "Publish review" }).click();
  await expect(
    page.getByText("Review published.", { exact: true }),
  ).toBeVisible();
  await page.goto("/reviews");
  await expect(page.getByText(review.text)).toBeVisible();
  await expect(page.getByText(review.phone, { exact: true })).toHaveCount(0);
});

test("admin gallery explains the repo workflow without storage uploads", async ({
  page,
}) => {
  await session(page);
  await setup(page);
  await page.goto("/admin/gallery");
  await expect(
    page.getByText("Add photos through your code", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/npm run gallery:generate/)).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
});

test("approved reviews refresh on return and every public card stays burgundy without pill badges", async ({
  page,
}) => {
  await setup(page);
  let published = false;
  await page.route("**/api/reviews**", (route) =>
    route.fulfill({ json: paged(published ? [review] : []) }),
  );
  await page.goto("/reviews");
  await expect(page.getByText("Lee", { exact: true })).toBeVisible();
  await expect(page.getByText(review.text)).toHaveCount(0);
  published = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText(review.text)).toBeVisible();
  const cards = page
    .locator("article")
    .filter({ has: page.locator("blockquote") });
  await expect(cards).toHaveCount(4);
  expect(
    await cards.evaluateAll(
      (nodes) =>
        new Set(nodes.map((n) => getComputedStyle(n).backgroundColor)).size,
    ),
  ).toBe(1);
  await expect(cards.locator(".rounded-full")).toHaveCount(0);
  await expect(page.getByText("a little customer love ♡")).toHaveCount(0);
});

test("homepage caps reviews at three while the reviews page shows published submissions", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/");
  const preview = page
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "Loved, kept, gifted",
        exact: true,
      }),
    });
  await expect(preview.locator("article")).toHaveCount(3);
  await expect(preview.getByText("Ada O.", { exact: true })).toHaveCount(0);
  await preview.getByRole("link", { name: "Read & write reviews →" }).click();
  await expect(page.getByText("Ada O.", { exact: true })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(4);
});

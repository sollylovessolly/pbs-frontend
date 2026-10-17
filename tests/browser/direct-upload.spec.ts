import { test, expect } from "@playwright/test";

test("a photo larger than 4.5 MB goes to storage while the review API receives only its token", async ({
  page,
}) => {
  test.skip(
    process.env.PBS_DIRECT_UPLOAD_TEST !== "true",
    "Requires a build with NEXT_PUBLIC_DIRECT_UPLOADS=true",
  );
  let storedBytes = 0;
  let finalized = false;
  await page.route("https://storage.example/**", async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    storedBytes = route.request().postDataBuffer()!.length;
    return route.fulfill({
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/uploads/direct") {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        kind: "review",
        contentType: "image/png",
        size: 4_800_000,
      });
      expect(body.sha256).toMatch(/^[a-f0-9]{64}$/);
      return route.fulfill({
        json: {
          token: "signed-file-reference",
          url: "https://storage.example/private",
          fields: { key: "incoming/test", policy: "signed-policy" },
        },
      });
    }
    if (path === "/api/reviews" && route.request().method() === "POST") {
      expect(route.request().headers()["content-type"]).toContain(
        "application/json",
      );
      expect(route.request().postDataBuffer()!.length).toBeLessThan(5000);
      expect(route.request().postDataJSON()).toMatchObject({
        displayName: "Ada",
        uploadTokens: ["signed-file-reference"],
        publicationConsent: "true",
      });
      finalized = true;
      return route.fulfill({
        status: 201,
        json: { id: "review-check", status: "PENDING" },
      });
    }
    return route.fulfill({
      json: {
        data: [],
        pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
      },
    });
  });
  await page.goto("/reviews");
  await page.getByLabel("Display name", { exact: true }).fill("Ada");
  await page.getByLabel("Your rating").selectOption("5");
  await page
    .getByLabel("Your review")
    .fill("The prints were lovely and arrived safely.");
  await page.getByLabel("Phone number (private)").fill("08012345678");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: "large-photo.png",
    mimeType: "image/png",
    buffer: Buffer.concat([png, Buffer.alloc(4_800_000 - png.length)]),
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(
    page.getByText("Thank you! Your review has been submitted for approval."),
  ).toBeVisible();
  expect(storedBytes).toBeGreaterThan(4_800_000);
  expect(finalized).toBe(true);
});

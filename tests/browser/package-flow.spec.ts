import { test, expect, type Page } from "@playwright/test";
const base = {
  isActive: true,
  inStock: true,
  availableQuantity: 100,
  tracksStock: true,
  reasonIfUnavailable: null,
};
const products = [
  {
    id: "p",
    name: "Polaroids",
    slug: "polaroids",
    category: "POLAROID",
    isActive: true,
    description: "",
    variants: [
      {
        ...base,
        id: "pv",
        name: "Standard Border",
        sku: "POLAROID-STANDARD",
        sellingPrice: 3500,
      },
    ],
  },
  {
    id: "c",
    name: "Phone Cases",
    slug: "phone-cases",
    category: "PHONE_CASE",
    isActive: true,
    description: "",
    variants: [
      {
        ...base,
        id: "cv",
        name: "iPhone 15",
        sku: "PHONECASE-IPHONE-15",
        sellingPrice: 5500,
      },
    ],
  },
  {
    id: "l",
    name: "Vintage Letters",
    slug: "vintage-letters",
    category: "VINTAGE_LETTER",
    isActive: true,
    description: "",
    variants: [
      {
        ...base,
        id: "lv",
        name: "Rusted Petals — Normal Edge",
        sku: "VINTAGE-RUSTED-PETALS-NORMAL",
        sellingPrice: 4000,
      },
    ],
  },
  {
    id: "s",
    name: "Photostrips",
    slug: "photostrips",
    category: "PHOTOSTRIP",
    isActive: true,
    description: "",
    variants: [
      {
        ...base,
        id: "sv",
        name: "Photostrip 1",
        sku: "PHOTOSTRIP-1",
        sellingPrice: 4000,
      },
    ],
  },
];
async function setup(page: Page) {
  await page.route("https://storage.example/**", (route) =>
    route.fulfill({
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    }),
  );
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/products")) return route.fulfill({ json: products });
    if (path.endsWith("/delivery-rates"))
      return route.fulfill({
        json: [{ state: "Lagos", fee: 3800, isActive: true }],
      });
    if (path.endsWith("/uploads/direct"))
      return route.fulfill({
        json: {
          token: "test-package-upload",
          url: "https://storage.example/package-upload",
          fields: {},
        },
      });
    if (path.endsWith("/uploads"))
      return route.fulfill({
        json: {
          key: "production/test.png",
          url: "https://example.com/artwork.png",
        },
      });
    return route.fulfill({ status: 404, json: { message: "Unavailable" } });
  });
}
async function photo(page: Page) {
  const data = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 600;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#bb4466";
    ctx.fillRect(0, 0, 600, 600);
    return c.toDataURL("image/png").split(",")[1];
  });
  return {
    name: "memory.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  };
}
async function rawCart(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("polaroidsbysolly-cart") || "[]"),
  );
}
test("package Polaroids enforce image and copy limits, return to saved progress, and complete the whole package", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/packages/you-and-me");
  await page
    .getByRole("link", { name: "Create 2 Polaroid prints →", exact: true })
    .click();
  await expect(page).toHaveURL(/giftPackage=you-and-me/);
  const file = await photo(page);
  const input = page.locator('input[type="file"]');
  await input.setInputFiles([
    file,
    { ...file, name: "two.png" },
    { ...file, name: "three.png" },
  ]);
  await expect(page.locator("p[role=alert]")).toContainText(
    "room for 2 more photos",
  );
  await input.setInputFiles([file, { ...file, name: "two.png" }]);
  await expect(
    page.getByRole("button", { name: "Increase quantity for photo 1" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Save 2 Prints to Package/ }).click();
  await expect(page).toHaveURL(/\/products\/packages\/you-and-me\?draft=/);
  await expect(page.getByText("2 / 2 ready", { exact: true })).toHaveCount(1);
  expect(
    (await rawCart(page)).every(
      (i: Record<string, unknown>) => !!i.packageDraftId && !i.packageGroupId,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByText("2 / 2 ready", { exact: true })).toHaveCount(1);
  await page.goto("/cart");
  await expect(
    page.getByText("Your cart is empty", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Continue your package →", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Create 2 phone cases →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Select iPhone 15", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase iPhone 15 quantity", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Increase iPhone 15 quantity",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: /Save.*Package/i })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/products\/packages\/you-and-me\?draft=/);
  await expect(page.getByText("2 / 2 ready", { exact: true })).toHaveCount(2);
  await page
    .getByRole("link", { name: "Create 1 vintage letter →", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Increase letter quantity", exact: true }),
  ).toBeDisabled();
  await page.locator("#vintage-letter-recipient").fill("My friend");
  await page
    .locator("#vintage-letter-message")
    .fill("Thank you for making every day a little brighter.");
  await page.locator("#vintage-letter-sender").fill("Solly");
  await page
    .getByRole("button", { name: "Save to Package", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/products\/packages\/you-and-me\?draft=/);
  await expect(
    page.getByRole("button", { name: /Complete package/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Complete package/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByText("You and Me: ₦21,000 · packaging included"),
  ).toBeVisible();
  const completed = await rawCart(page);
  expect(
    completed.every(
      (i: Record<string, unknown>) =>
        i.packageId === "you-and-me" && !!i.packageGroupId && !i.packageDraftId,
    ),
  ).toBe(true);
  await page.goto("/checkout");
  await expect(
    page.getByText(
      "Premium protective packaging is included with your gift package.",
    ),
  ).toBeVisible();
});
test("package drafts keep saved Polaroids separate across offers", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/packages/birthday-mini");
  await page
    .getByRole("link", { name: "Create 2 Polaroid prints →", exact: true })
    .click();
  const file = await photo(page);
  await page.locator('input[type="file"]').setInputFiles(file);
  await page
    .getByRole("button", { name: "Increase quantity for photo 1" })
    .click();
  await expect(
    page.getByRole("button", { name: "Increase quantity for photo 1" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Save 2 Prints to Package/ }).click();
  await expect(page).toHaveURL(/birthday-mini\?draft=/);
  await page.goto("/products/packages/you-and-me");
  await expect(
    page.getByRole("link", { name: "Create 2 Polaroid prints →", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("2 / 2 ready", { exact: true })).toHaveCount(0);
});

test("photostrip package limits designs and copy quantities to the included strip count", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/packages/make-a-wish");
  await page
    .getByRole("link", { name: "Create 1 photostrips →", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Choose.*design|Choose.*template|Add.*design/i,
    })
    .first()
    .click();
  const picker = page.getByRole("dialog", {
    name: "Choose photostrip designs",
  });
  await picker
    .getByRole("button", { name: "Add", exact: true })
    .first()
    .click();
  await expect(
    picker.getByRole("button", { name: "Add another Memories Noir strip" }),
  ).toBeDisabled();
  await picker
    .getByRole("button", { name: /Done — 1 Design Selected/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Increase quantity for Memories Noir" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "← Continue Make a Wish" }).click();
  await expect(
    page.getByRole("button", { name: /Complete package/ }),
  ).toBeDisabled();
});

import { test, expect, type Page } from "@playwright/test";
const base = {
  availableQuantity: 100,
  previewUrl: "/images/products/polaroids.jpg",
  turnaround: "Made to order",
  isFast: false,
};
const items = [
  {
    ...base,
    id: "prints",
    productType: "polaroid",
    variantSku: "PRINT",
    name: "Custom Polaroids",
    unitPrice: 3500,
    quantity: 2,
    editHref: "/products/polaroids",
    customization: {
      finalPngUrl: "https://api.example/final",
      previewUrl: "https://api.example/preview",
    },
  },
  {
    ...base,
    id: "cases",
    productType: "phone-case",
    variantSku: "CASE",
    name: "Phone cases",
    unitPrice: 5500,
    quantity: 2,
    editHref: "/products/phone-cases",
    customization: { package: "CASE_ONLY" },
  },
  {
    ...base,
    id: "letter",
    productType: "vintage-letter",
    variantSku: "LETTER",
    name: "Vintage letter",
    unitPrice: 4000,
    quantity: 1,
    editHref: "/products/vintage-letters",
    customization: { finalPdfUrl: "https://api.example/letter" },
  },
];
const products = ["POLAROID", "PHONE_CASE", "VINTAGE_LETTER"].map(
  (category, i) => ({
    id: String(i),
    category,
    name: items[i].name,
    slug: category,
    isActive: true,
    description: "",
    variants: [
      {
        id: String(i),
        sku: items[i].variantSku,
        name: items[i].name,
        sellingPrice: items[i].unitPrice,
        isActive: true,
        inStock: true,
        availableQuantity: 100,
        tracksStock: true,
        reasonIfUnavailable: null,
      },
    ],
  }),
);
async function setup(page: Page, cart = items) {
  await page.addInitScript((cart) => {
    if (!localStorage.getItem("polaroidsbysolly-cart"))
      localStorage.setItem("polaroidsbysolly-cart", JSON.stringify(cart));
  }, cart);
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/products")) return route.fulfill({ json: products });
    if (path.endsWith("/delivery-rates"))
      return route.fulfill({
        json: [{ state: "Lagos", fee: 3800, isActive: true }],
      });
    return route.fulfill({ status: 503, json: { message: "Unavailable" } });
  });
}
async function details(page: Page) {
  await page.getByLabel("Full name", { exact: true }).fill("Test Buyer");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("08012345678");
  await page
    .getByLabel("Complete delivery address", { exact: true })
    .fill("12 Example Street, Ikeja");
  await page.getByLabel("State", { exact: true }).selectOption("Lagos");
}
test("six gift packages list the final prices and contents", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: "Gift packages", exact: true }),
  ).toBeVisible();
  for (const name of [
    "You and Me",
    "Moments with You",
    "I Love You",
    "Birthday Mini",
    "Make a Wish",
    "Ultimate Birthday Gift",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  const moments = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Moments with You", exact: true }),
  });
  await expect(moments).toContainText("₦38,000");
  await expect(moments.locator("img").first()).toBeVisible();
  await expect
    .poll(() =>
      moments
        .locator("img")
        .first()
        .evaluate((el: HTMLImageElement) => el.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(moments).not.toContainText("photostrip");
});
test("complete package has one fixed cart price, locked quantities and included packaging at checkout", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/packages/you-and-me");
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await page.getByRole("button", { name: /Complete package/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByText("You and Me: ₦21,000 · packaging included"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Increase quantity for Custom Polaroids",
    }),
  ).toBeDisabled();
  await page.goto("/checkout");
  await expect(
    page.getByText(
      "Premium protective packaging is included with your gift package.",
    ),
  ).toBeVisible();
  await details(page);
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByText("Estimated total: ₦24,800.00")).toBeVisible();
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/orders", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      status: 400,
      json: { message: "Test checkout intercepted" },
    });
  });
  await page
    .getByRole("button", { name: "Place order & pay securely" })
    .click();
  await expect.poll(() => payload?.premiumPackaging).toBe(true);
  expect(
    (payload!.items as Array<Record<string, unknown>>).every(
      (i) =>
        i.packageId === "you-and-me" && typeof i.packageGroupId === "string",
    ),
  ).toBe(true);
});
test("ordinary checkout adds exactly 1500 for the protective box and sends the choice", async ({
  page,
}) => {
  await setup(page, [items[0]]);
  await page.goto("/checkout");
  await details(page);
  await expect(page.getByText("Estimated total: ₦10,800.00")).toBeVisible();
  await page
    .getByRole("checkbox", { name: /Premium protective packaging/ })
    .check();
  await expect(page.getByText("Estimated total: ₦12,300.00")).toBeVisible();
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  let payload: Record<string, unknown> | undefined;
  await page.route("**/api/orders", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      status: 400,
      json: { message: "Test checkout intercepted" },
    });
  });
  await page
    .getByRole("button", { name: "Place order & pay securely" })
    .click();
  await expect.poll(() => payload?.premiumPackaging).toBe(true);
});
test("customer-provided quotes remain visible when the reviews API is unavailable", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/reviews");
  for (const name of ["Lee", "Amanda", "Tomiwa"])
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText(/i love your packaging so much/)).toBeVisible();
  await expect(
    page.getByText("Verified purchase", { exact: true }),
  ).toHaveCount(0);
});

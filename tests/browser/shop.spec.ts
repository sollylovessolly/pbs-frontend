import { test, expect, type Page } from "@playwright/test";
const variant = {
  id: "v1",
  name: "Standard Album",
  sku: "ALBUM-STANDARD",
  sellingPrice: "5000",
  isActive: true,
  inStock: true,
  availableQuantity: 3,
  tracksStock: true,
  reasonIfUnavailable: null,
};
const product = {
  id: "p1",
  name: "Albums",
  slug: "albums",
  description: "Keep your memories.",
  category: "ALBUM",
  isActive: true,
  variants: [variant],
};
const cartItem = {
  id: "cart1",
  productType: "album",
  variantSku: variant.sku,
  name: "Memory Album",
  unitPrice: 5000,
  quantity: 1,
  availableQuantity: 3,
  previewUrl: "/images/categories/photo-album.jpg",
  turnaround: "Made to order",
  editHref: "/products/albums",
  isFast: false,
};
async function mock(page: Page) {
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/products")) return route.fulfill({ json: [product] });
    if (path.endsWith("/delivery-rates"))
      return route.fulfill({
        json: [{ state: "Lagos", fee: "3800", isActive: true }],
      });
    if (path.endsWith("/shipping/rates"))
      return route.fulfill({
        status: 503,
        json: { message: "provider internals" },
      });
    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });
}
async function seedCart(page: Page) {
  await page.addInitScript(
    (item) =>
      localStorage.setItem("polaroidsbysolly-cart", JSON.stringify([item])),
    cartItem,
  );
}
test("catalogue loads authoritative price, and unavailable product disables purchase", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/products");
  await expect(page.getByText("from ₦5,000", { exact: false })).toBeVisible();
  await page.route("**/api/products", (r) =>
    r.fulfill({
      json: [
        {
          ...product,
          variants: [
            {
              ...variant,
              inStock: false,
              availableQuantity: 0,
              reasonIfUnavailable: "Sold out",
            },
          ],
        },
      ],
    }),
  );
  await page.goto("/products/albums");
  await expect(page.getByText("Sold out", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Out of Stock/i }).first(),
  ).toBeDisabled();
});
test("cart quantity cannot exceed availability", async ({ page }) => {
  await mock(page);
  await seedCart(page);
  await page.goto("/cart");
  const plus = page.getByRole("button", {
    name: "Increase quantity for Memory Album",
  });
  for (let i = 0; i < 5; i++) await plus.click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!)[0]
            .quantity,
      ),
    )
    .toBe(3);
});
test("tracking lookup sends normalized phone, handles empty results and follows real token", async ({
  page,
}) => {
  await mock(page);
  let searches = 0;
  await page.route("**/api/tracking/orders", (route) => {
    expect(route.request().postDataJSON()).toEqual({ phone: "08012345678" });
    searches++;
    return route.fulfill({
      json:
        searches === 1
          ? []
          : [
              {
                trackingToken: "safe-token",
                orderNumber: "PBS-1",
                status: "PRINTING",
                paymentStatus: "PAID",
                totalAmount: "8800",
                createdAt: "2026-09-17T10:00:00Z",
                items: [{ name: "Album", quantity: 1 }],
              },
            ],
    });
  });
  await page.goto("/track-order");
  await page.getByLabel("Phone number", { exact: true }).fill("0801 234 5678");
  await page.getByRole("button", { name: "Find My Orders" }).click();
  await expect(page.getByText(/No orders found/i)).toBeVisible();
  await page.getByRole("button", { name: "Find My Orders" }).click();
  await expect(page.locator('a[href="/orders/safe-token"]')).toBeVisible();
});
test("checkout prevents duplicate order and retries payment against the same order after reload", async ({
  page,
}) => {
  await mock(page);
  await seedCart(page);
  let orders = 0;
  let initializations = 0;
  await page.route("**/api/orders", async (route) => {
    orders++;
    const payload = route.request().postDataJSON();
    expect(payload.source).toBe("WEBSITE");
    expect(payload.items).toEqual([
      { variantSku: "ALBUM-STANDARD", quantity: 1 },
    ]);
    expect(payload).not.toHaveProperty("totalAmount");
    await new Promise((r) => setTimeout(r, 150));
    await route.fulfill({
      json: {
        id: "order1",
        orderNumber: "PBS-1",
        totalAmount: "8800",
        paymentStatus: "UNPAID",
      },
    });
  });
  await page.route("**/api/payments/initialize", (route) => {
    initializations++;
    expect(route.request().postDataJSON()).toEqual({ orderId: "order1" });
    return route.fulfill({ status: 503, json: { message: "provider secret" } });
  });
  await page.goto("/checkout");
  await page.getByLabel("Full name", { exact: true }).fill("Test Buyer");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("08012345678");
  await page
    .getByLabel("Complete delivery address", { exact: true })
    .fill("12 Example Street, Ikeja");
  await page.getByLabel("State", { exact: true }).selectOption("Lagos");
  await page.getByRole("button", { name: "Review order" }).click();
  const pay = page.getByRole("button", { name: "Place order & pay securely" });
  await expect(pay).toBeVisible();
  await pay.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect(
    page.getByRole("button", { name: "Retry payment" }),
  ).toBeVisible();
  expect(orders).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Retry payment" }).click();
  await expect.poll(() => initializations).toBe(2);
  expect(orders).toBe(1);
  await expect(page.getByRole("main").getByRole("alert")).not.toContainText(
    "secret",
  );
});
test("callback only clears purchased lines after backend verifies PAID, and can retry", async ({
  page,
}) => {
  await mock(page);
  await seedCart(page);
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "pbs-pending-payment-v1",
      JSON.stringify({
        orderId: "order1",
        orderNumber: "PBS-1",
        totalAmount: "8800",
        reference: "ref1",
        itemIds: ["cart1"],
      }),
    ),
  );
  let verifications = 0;
  await page.route("**/api/payments/verify", (r) => {
    expect(r.request().postDataJSON()).toEqual({ reference: "ref1" });
    verifications++;
    return r.fulfill({
      json: {
        id: "order1",
        orderNumber: "PBS-1",
        totalAmount: "8800",
        paymentStatus: verifications === 1 ? "UNPAID" : "PAID",
      },
    });
  });
  await page.goto("/payments/callback?reference=ref1");
  await expect(page.getByText(/not confirmed yet/)).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
    ),
  ).toBe(1);
  await page.getByRole("button", { name: "Check payment again" }).click();
  await expect(
    page.getByRole("heading", { name: "Payment successful" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
      ),
    )
    .toBe(0);
});

test("vintage letter exports a real PDF and stores only its uploaded URL", async ({
  page,
}) => {
  const alerts: string[] = [];
  page.on("dialog", async (dialog) => {
    alerts.push(dialog.message());
    await dialog.dismiss();
  });
  await mock(page);
  await page.route("**/api/products", (r) =>
    r.fulfill({
      json: [
        {
          ...product,
          category: "VINTAGE_LETTER",
          slug: "vintage-letters",
          name: "Vintage Letters",
          variants: [
            {
              ...variant,
              name: "Rusted Petals — Normal Edge",
              sku: "VINTAGE-RUSTED-PETALS-NORMAL",
            },
          ],
        },
      ],
    }),
  );
  let uploaded = false;
  await page.route("**/api/uploads", (r) => {
    const body = r.request().postDataBuffer()!;
    expect(body.includes(Buffer.from("VINTAGE_LETTER_FINAL"))).toBe(true);
    expect(body.includes(Buffer.from("%PDF-1.4"))).toBe(true);
    expect(body.includes(Buffer.from("/MediaBox [0 0 595.28 841.89]"))).toBe(
      true,
    );
    uploaded = true;
    return r.fulfill({
      json: {
        key: "production/letter.pdf",
        url: "https://example.com/letter.pdf",
      },
    });
  });
  await page.goto("/products/vintage-letters");
  await page.locator("#vintage-letter-recipient").fill("My friend");
  await page
    .locator("#vintage-letter-message")
    .fill("Thank you for making every day a little brighter.");
  await page.locator("#vintage-letter-sender").fill("Solly");
  await page
    .getByRole("button", { name: /Add to Cart/i })
    .first()
    .click();
  await expect
    .poll(async () => alerts[0] || new URL(page.url()).pathname, {
      timeout: 15000,
    })
    .toBe("/cart");
  expect(uploaded).toBe(true);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!),
  );
  expect(saved[0].customization).toEqual({
    finalPdfUrl: "https://example.com/letter.pdf",
  });
  expect(saved[0].variantSku).toBe("VINTAGE-RUSTED-PETALS-NORMAL");
  expect(JSON.stringify(saved)).not.toContain("data:");
});

test("photostrip design choices use the confirmed individual catalogue prices", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/products", (r) =>
    r.fulfill({
      json: [
        {
          ...product,
          category: "PHOTOSTRIP",
          slug: "photostrips",
          variants: Array.from({ length: 5 }, (_, i) => ({
            ...variant,
            id: `v${i}`,
            sku: `PHOTOSTRIP-${i + 1}`,
            name: `Photostrip ${i + 1}`,
            sellingPrice: String(4000 + i * 100),
          })),
        },
      ],
    }),
  );
  await page.goto("/products/photostrips");
  await page
    .getByRole("button", {
      name: /Choose.*design|Choose.*template|Add.*design/i,
    })
    .first()
    .click();
  await expect(
    page.getByText("Memories Noir · ₦4,000", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Classic Black · ₦4,100", { exact: true }),
  ).toBeVisible();
});

test("polaroid uploads valid PNGs, retries one failed file and keeps the completed production file", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/products", (r) =>
    r.fulfill({
      json: [
        {
          ...product,
          category: "POLAROID",
          slug: "polaroids",
          variants: [{ ...variant, sku: "POLAROID-STANDARD" }],
        },
      ],
    }),
  );
  const counts = { final: 0, preview: 0 };
  page.on("dialog", (dialog) => dialog.accept());
  await page.route("**/api/uploads", (r) => {
    const body = r.request().postDataBuffer()!;
    expect(body.includes(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
      true,
    );
    const preview = body.includes(Buffer.from("POLAROID_PREVIEW"));
    counts[preview ? "preview" : "final"]++;
    if (preview && counts.preview === 1)
      return r.fulfill({
        status: 503,
        json: { message: "upload unavailable" },
      });
    return r.fulfill({
      json: {
        key: "production/image.png",
        url: `https://example.com/${preview ? "preview" : "final"}.png`,
      },
    });
  });
  await page.goto("/products/polaroids");
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#bb4466";
    ctx.fillRect(0, 0, 600, 600);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "memory.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64"),
  });
  const add = page.getByRole("button", { name: /Add 1 .*Cart/i });
  await add.click();
  await expect(
    page.getByRole("button", { name: "Retry this file" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry this file" }).click();
  await expect(
    page.getByRole("button", { name: "Retry this file" }),
  ).toHaveCount(0);
  await add.click();
  await expect(page).toHaveURL(/\/cart$/);
  expect(counts).toEqual({ final: 1, preview: 2 });
  await page.goto("/products/polaroids");
  await expect(page.getByRole("region", { name: "Photo uploads" })).toHaveCount(
    0,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!),
  );
  expect(saved[0].customization).toEqual({
    finalPngUrl: "https://example.com/final.png",
    previewUrl: "https://example.com/preview.png",
  });
});

test("current public catalogue without active flags appears on homepage and catalogue", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/products", (route) => {
    const current = JSON.parse(JSON.stringify(product));
    delete current.isActive;
    for (const v of current.variants) delete v.isActive;
    return route.fulfill({ json: [current] });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Albums", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("New keepsakes are coming soon."),
  ).not.toBeVisible();
  await page.goto("/products");
  await expect(page.getByText("from ₦5,000", { exact: false })).toBeVisible();
});

test("checkout recovers a lost order response with the same key and skips optional courier requests", async ({
  page,
}) => {
  await mock(page);
  await seedCart(page);
  const bodies: Array<Record<string, unknown>> = [];
  let quotes = 0;
  await page.route("**/api/shipping/rates", (r) => {
    quotes++;
    return r.fulfill({ json: { requestToken: "test", couriers: [] } });
  });
  await page.route("**/api/orders", (r) => {
    bodies.push(r.request().postDataJSON());
    return r.fulfill(
      bodies.length === 1
        ? { status: 503, json: { message: "Interrupted" } }
        : {
            json: {
              id: "order1",
              orderNumber: "PBS-1",
              totalAmount: "8800",
              paymentStatus: "UNPAID",
            },
          },
    );
  });
  await page.route("**/api/payments/initialize", (r) =>
    r.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.goto("/checkout");
  await page.getByLabel("Full name", { exact: true }).fill("Test Buyer");
  await page.getByLabel("Email", { exact: true }).fill("test@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("08012345678");
  await page
    .getByLabel("Complete delivery address")
    .fill("12 Example Street, Ikeja");
  await page.getByLabel("State", { exact: true }).selectOption("Lagos");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await page
    .getByRole("button", { name: "Place order & pay securely" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Continue your order" }),
  ).toBeVisible();
  expect(typeof bodies[0].checkoutKey).toBe("string");
  expect(String(bodies[0].checkoutKey).length).toBeGreaterThan(20);
  await page.reload();
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(
    page.getByRole("button", { name: "Retry payment" }),
  ).toBeVisible();
  expect(bodies).toHaveLength(2);
  expect(bodies[1]).toEqual(bodies[0]);
  expect(quotes).toBe(0);
});

test("PBS order number plus checkout phone opens the correct secure tracking detail", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/tracking/orders", (r) => {
    expect(r.request().postDataJSON()).toEqual({ phone: "08012345678" });
    return r.fulfill({
      json: [
        {
          orderNumber: "PBS-123",
          trackingToken: "CaseSensitive_AbC",
          status: "PENDING",
          items: [],
        },
      ],
    });
  });
  await page.route("**/api/tracking/CaseSensitive_AbC", (r) =>
    r.fulfill({
      json: {
        orderNumber: "PBS-123",
        trackingToken: "CaseSensitive_AbC",
        status: "PENDING",
        items: [],
        timeline: [],
      },
    }),
  );
  await page.goto("/track-order");
  await page.getByLabel("Order number or tracking link").fill("PBS-123");
  await page
    .getByLabel("Phone number used for this order")
    .fill("0801 234 5678");
  await page.getByRole("button", { name: "Find order", exact: true }).click();
  await expect(page).toHaveURL(/orders\/CaseSensitive_AbC$/);
  await expect(
    page.getByText("PBS-123", { exact: false }).first(),
  ).toBeVisible();
});
test("tracking links preserve mixed-case tokens and unmatched PBS orders stay on the form", async ({
  page,
}) => {
  await mock(page);
  await page.route("**/api/tracking/orders", (r) => r.fulfill({ json: [] }));
  await page.route("**/api/tracking/MixedCase_123", (r) =>
    r.fulfill({
      json: {
        orderNumber: "PBS-321",
        trackingToken: "MixedCase_123",
        status: "PENDING",
        items: [],
        timeline: [],
      },
    }),
  );
  await page.goto("/track-order");
  await page.getByLabel("Order number or tracking link").fill("PBS-321");
  await page.getByLabel("Phone number used for this order").fill("08012345678");
  await page.getByRole("button", { name: "Find order", exact: true }).click();
  await expect(page.getByText(/No paid order matches/)).toBeVisible();
  await page
    .getByLabel("Order number or tracking link")
    .fill("https://shop.example/orders/MixedCase_123");
  await page.getByRole("button", { name: "Find order", exact: true }).click();
  await expect(page).toHaveURL(/orders\/MixedCase_123$/);
});
for (const cancel of [false, true])
  test(`Paystack popup ${cancel ? "cancellation preserves cart" : "success verifies before showing modal"} without leaving checkout`, async ({
    page,
  }) => {
    await mock(page);
    await seedCart(page);
    await page.addInitScript(() =>
      sessionStorage.setItem(
        "pbs-pending-payment-v1",
        JSON.stringify({
          orderId: "order1",
          orderNumber: "PBS-1",
          totalAmount: "8800",
          itemIds: ["cart1"],
        }),
      ),
    );
    await page.route("https://js.paystack.co/v2/inline.js", (r) =>
      r.fulfill({
        contentType: "application/javascript",
        body: `window.PaystackPop=class {resumeTransaction(code, callbacks){ if(code!=='test-access')throw new Error('Wrong access code');setTimeout(()=>callbacks.${cancel ? "onCancel" : "onSuccess"}(),10);}};`,
      }),
    );
    await page.route("**/api/payments/initialize", (r) =>
      r.fulfill({
        json: {
          authorizationUrl: "https://checkout.paystack.com/test-access",
          accessCode: "test-access",
          reference: "ref-popup",
        },
      }),
    );
    let verifications = 0;
    await page.route("**/api/payments/verify", async (r) => {
      verifications++;
      await new Promise((resolve) => setTimeout(resolve, 200));
      await r.fulfill({
        json: {
          id: "order1",
          orderNumber: "PBS-1",
          paymentStatus: "PAID",
          totalAmount: "8800",
          trackingToken: "secure_ABC",
        },
      });
    });
    await page.goto("/checkout");
    await page.getByRole("button", { name: "Retry payment" }).click();
    if (cancel) {
      await expect(
        page.getByRole("button", { name: "Retry payment" }),
      ).toBeEnabled();
      expect(verifications).toBe(0);
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
        ),
      ).toBe(1);
    } else {
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Payment successful" }),
      ).toBeVisible();
      expect(verifications).toBe(1);
      await expect(
        page
          .getByRole("dialog")
          .getByRole("link", { name: "Track your order" }),
      ).toHaveAttribute("href", "/orders/secure_ABC");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
          ),
        )
        .toBe(0);
      await page.screenshot({ path: "/tmp/pbs-payment-modal.png" });
    }
    await expect(page).toHaveURL(/\/checkout$/);
  });

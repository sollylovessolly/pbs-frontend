import { test, expect, type Page } from "@playwright/test";
const catalogue = [
  ["POLAROID", "polaroids", "POLAROID-STANDARD", "Standard Border"],
  ["PHOTOSTRIP", "photostrips", "PHOTOSTRIP-1", "Photostrip 1"],
  [
    "VINTAGE_LETTER",
    "vintage-letters",
    "VINTAGE-RUSTED-PETALS-NORMAL",
    "Rusted Petals",
  ],
  ["PHONE_CASE", "phone-cases", "PHONECASE-IPHONE-15", "iPhone 15"],
  ["ALBUM", "albums", "ALBUM-STANDARD", "Standard Album"],
].map(([category, slug, sku, name], i) => ({
  id: `p${i}`,
  name: slug,
  slug,
  category,
  variants: [
    {
      id: `v${i}`,
      sku,
      name,
      sellingPrice: "5000",
      inStock: true,
      availableQuantity: 20,
      tracksStock: true,
    },
  ],
}));
async function setup(page: Page) {
  await page.route("**/api/**", (r) => {
    const path = new URL(r.request().url()).pathname;
    if (path.endsWith("/products")) return r.fulfill({ json: catalogue });
    if (path.endsWith("/delivery-rates"))
      return r.fulfill({
        json: [{ state: "Lagos", fee: "3800", isActive: true }],
      });
    return r.fulfill({ status: 404, json: { message: "Not found" } });
  });
}
async function details(page: Page) {
  await page.getByLabel("Full name", { exact: true }).fill("QA Buyer");
  await page.getByLabel("Email", { exact: true }).fill("qa@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("08012345678");
  await page
    .getByLabel("Complete delivery address")
    .fill("12 Example Street, Ikeja");
  await page.getByLabel("State", { exact: true }).selectOption("Lagos");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
}
async function album(page: Page) {
  await page.goto("/products/albums");
  await page
    .getByRole("button", { name: /Add.*Cart/i })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/cart$/);
}
test("full shopping journey applies cart promo, opens payment, verifies and tracks", async ({
  page,
}) => {
  await setup(page);
  let orders = 0;
  await page.route("**/api/orders", (r) => {
    const body = r.request().postDataJSON();
    orders++;
    expect(body.checkoutKey).toMatch(/^[\da-f-]{36}$/);
    expect(body.discountCode).toBe("WELCOME10");
    expect(body.items).toEqual([{ variantSku: "ALBUM-STANDARD", quantity: 1 }]);
    return r.fulfill({
      json: {
        id: "qa-order",
        orderNumber: "PBS-QA",
        totalAmount: "8300",
        paymentStatus: "UNPAID",
      },
    });
  });
  await page.route("**/api/payments/initialize", (r) =>
    r.fulfill({
      json: {
        accessCode: "qa-access",
        reference: "qa-ref",
        authorizationUrl: "https://checkout.paystack.com/qa-access",
      },
    }),
  );
  await page.route("https://js.paystack.co/v2/inline.js", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: "window.PaystackPop=class {resumeTransaction(code,c){if(code!=='qa-access')throw Error('code');c.onSuccess();}};",
    }),
  );
  await page.route("**/api/payments/verify", (r) =>
    r.fulfill({
      json: {
        id: "qa-order",
        orderNumber: "PBS-QA",
        totalAmount: "8300",
        paymentStatus: "PAID",
        trackingToken: "qa_Token",
      },
    }),
  );
  await page.route("**/api/tracking/qa_Token", (r) =>
    r.fulfill({
      json: {
        orderNumber: "PBS-QA",
        status: "PENDING",
        paymentStatus: "PAID",
        trackingToken: "qa_Token",
        items: [{ name: "Album", quantity: 1 }],
        timeline: [],
      },
    }),
  );
  await album(page);
  await page.getByPlaceholder("Promo code").fill("WELCOME10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByText(/Code saved/)).toBeVisible();
  await page
    .getByRole("link", { name: "Proceed to Checkout", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByLabel("Discount code (optional)")).toHaveValue(
    "WELCOME10",
  );
  await details(page);
  await page
    .getByRole("button", { name: "Place order & pay securely" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Payment successful" }),
  ).toBeVisible();
  expect(orders).toBe(1);
  await page
    .getByRole("link", { name: "Track your order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/orders\/qa_Token$/);
  await expect(
    page.getByRole("heading", { name: "Order PBS-QA" }),
  ).toBeVisible();
});
test("failed payment script can retry without creating another order", async ({
  page,
}) => {
  await setup(page);
  let orders = 0,
    scripts = 0;
  await page.route("**/api/orders", (r) => {
    orders++;
    return r.fulfill({
      json: {
        id: "qa-order",
        orderNumber: "PBS-QA",
        totalAmount: "8800",
        paymentStatus: "UNPAID",
      },
    });
  });
  await page.route("**/api/payments/initialize", (r) =>
    r.fulfill({ json: { accessCode: "qa-access", reference: "qa-ref" } }),
  );
  await page.route("https://js.paystack.co/v2/inline.js", (r) =>
    ++scripts === 1
      ? r.abort()
      : r.fulfill({
          contentType: "application/javascript",
          body: "window.PaystackPop=class {resumeTransaction(code,c){c.onCancel();}};",
        }),
  );
  await album(page);
  await page.goto("/checkout");
  await details(page);
  await page
    .getByRole("button", { name: "Place order & pay securely" })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Payment could not open",
  );
  await page.getByRole("button", { name: "Retry payment" }).click();
  await expect(
    page.getByRole("button", { name: "Retry payment" }),
  ).toBeEnabled();
  expect(orders).toBe(1);
  expect(scripts).toBe(2);
});
test("malformed saved cart cannot crash the shop", async ({ page }) => {
  await setup(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "polaroidsbysolly-cart",
      JSON.stringify([null, { quantity: "bad" }]),
    ),
  );
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Your cart is empty" }),
  ).toBeVisible();
});
test("phone case can be selected, added and restored without a wrong photo preview", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/phone-cases");
  await page
    .getByRole("button", { name: "Select iPhone 15", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Add 1 Case/i })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "No, View Cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!),
  );
  expect(saved[0].customization).toEqual({ package: "CASE_ONLY" });
  expect(saved[0].previewUrl).toBe(
    "/images/categories/polaroid-phonecase.jpeg",
  );
});
test("all customer pages fit a mobile screen and local footer destinations exist", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 360, height: 800 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/products",
    ...catalogue.map((p) => `/products/${p.slug}`),
    "/cart",
    "/checkout",
    "/track-order",
    "/about",
    "/delivery",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("main").first()).toBeVisible();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        { message: path },
      )
      .toBe(true);
  }
  await page.goto("/");
  await expect(page.locator("#faqs")).toHaveCount(1);
  const destinations = await page
    .locator("footer a[href^='/']")
    .evaluateAll((links) => [
      ...new Set(
        links.map((l) => l.getAttribute("href")!.split("#")[0] || "/"),
      ),
    ]);
  for (const path of destinations) {
    const r = await page.request.get(path);
    expect(r.status(), path).toBe(200);
  }
  expect(errors).toEqual([]);
});

for (const kind of ["polaroids", "photostrips"]) {
  test(`${kind} crops survive rotation, dragging, editor close and print export`, async ({
    page,
  }) => {
    await setup(page);
    let uploads = 0;
    const dimensions: number[][] = [];
    await page.route("**/api/uploads", (r) => {
      uploads++;
      const body = r.request().postDataBuffer()!;
      const offset = body.indexOf(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );
      dimensions.push([
        body.readUInt32BE(offset + 16),
        body.readUInt32BE(offset + 20),
      ]);
      expect(
        r
          .request()
          .postDataBuffer()!
          .includes(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      ).toBe(true);
      return r.fulfill({
        json: {
          key: `qa/${uploads}.png`,
          url: `https://example.com/qa-${uploads}.png`,
        },
      });
    });
    await page.goto(`/products/${kind}`);
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 900;
      c.height = 1600;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#952e44";
      ctx.fillRect(0, 0, 900, 1600);
      return c.toDataURL().split(",")[1];
    });
    const file = {
      name: "crop-test.png",
      mimeType: "image/png",
      buffer: Buffer.from(png, "base64"),
    };
    if (kind === "polaroids") {
      await page.locator("input[type=file]").setInputFiles(file);
      await page
        .getByRole("button", { name: "Edit crop", exact: true })
        .click();
    } else {
      await page
        .getByRole("button", { name: "Choose designs", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .locator("article")
        .first()
        .getByRole("button", { name: "Add", exact: true })
        .click();
      await page
        .getByRole("button", { name: /Done.*Design.*Selected/ })
        .click();
      await page
        .getByRole("button", { name: "Add photos", exact: true })
        .click();
      const chooser = page.waitForEvent("filechooser");
      await page
        .getByRole("button", { name: "Choose photos", exact: true })
        .click();
      await (
        await chooser
      ).setFiles([
        file,
        { ...file, name: "second.png" },
        { ...file, name: "third.png" },
      ]);
      await page
        .getByRole("button", { name: "Adjust photo 1", exact: true })
        .click();
    }
    const dialog = page.getByRole("dialog");
    const photo = dialog.getByAltText("Your cropped photo").first();
    for (const rotation of [0, 90, 180, 270]) {
      await dialog
        .getByRole("button", { name: `${rotation}°`, exact: true })
        .click();
      const bounds = (await photo.locator("..").boundingBox())!;
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(bounds.x + 1000, bounds.y + 1000);
      await page.mouse.up();
      await expect
        .poll(() =>
          photo.evaluate((el) => {
            const a = el.getBoundingClientRect(),
              b = el.parentElement!.getBoundingClientRect();
            return (
              a.left <= b.left + 0.1 &&
              a.top <= b.top + 0.1 &&
              a.right >= b.right - 0.1 &&
              a.bottom >= b.bottom - 0.1
            );
          }),
        )
        .toBe(true);
    }
    const cropStyle = await photo.getAttribute("style");
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await expect(
      page.getByAltText("Your cropped photo").first(),
    ).toHaveAttribute("style", cropStyle!);
    await expect
      .poll(() =>
        page.evaluate(async (kind) => {
          const db = await new Promise<IDBDatabase>((resolve) => {
            const r = indexedDB.open("pbs-photo-drafts", 1);
            r.onsuccess = () => resolve(r.result);
          });
          const record = await new Promise<
            | { value: { rotation?: number; slots?: { rotation: number }[] }[] }
            | undefined
          >((resolve) => {
            const r = db
              .transaction("drafts")
              .objectStore("drafts")
              .get(
                kind === "polaroids"
                  ? "polaroids:POLAROID-STANDARD"
                  : "photostrips",
              );
            r.onsuccess = () => resolve(r.result);
          });
          db.close();
          return kind === "polaroids"
            ? record?.value[0]?.rotation
            : record?.value[0]?.slots?.[0]?.rotation;
        }, kind),
      )
      .toBe(270);
    await page.reload();
    await expect(
      page.getByText("Your unfinished design is back.", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByAltText("Your cropped photo").first(),
    ).toHaveAttribute("style", cropStyle!);
    await page
      .getByRole("button", { name: /Add.*Cart/i })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/cart$/, { timeout: 15000 });
    expect(uploads).toBe(kind === "polaroids" ? 2 : 1);
    if (kind === "polaroids") {
      expect(dimensions[0][0] / dimensions[0][1]).toBeCloseTo(
        (1080 * 0.58) / (1920 * 0.42),
        2,
      );
      expect(dimensions[1][0]).toBe(400);
      expect(dimensions[1][0] / dimensions[1][1]).toBeCloseTo(1080 / 1920, 2);
    }
    await page.reload();
    const preview = page.locator('img[alt$=" preview"]').first();
    await expect(preview).toBeVisible();
    await expect
      .poll(() => preview.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!),
    );
    expect(saved[0].previewUrl).toMatch(/^data:image\/jpeg/);
    await page.goto(`/products/${kind}`);
    await expect(
      page.getByRole("button", { name: "Clear draft", exact: true }),
    ).toHaveCount(0);
  });
}

for (const scenario of ["already-paid", "unconfirmed", "mismatched-order"]) {
  test(`payment recovery handles ${scenario} without losing unpaid cart items`, async ({
    page,
  }) => {
    await setup(page);
    await album(page);
    await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!);
      sessionStorage.setItem(
        "pbs-pending-payment-v1",
        JSON.stringify({
          orderId: "qa-order",
          orderNumber: "PBS-QA",
          totalAmount: "8800",
          reference: "qa-ref",
          itemIds: items.map((item: { id: string }) => item.id),
        }),
      );
    });
    await page.route("**/api/payments/initialize", (r) =>
      r.fulfill({
        status: 400,
        json: { message: "This order has already been paid" },
      }),
    );
    await page.route("**/api/payments/verify", (r) =>
      r.fulfill({
        json: {
          id: scenario === "mismatched-order" ? "different-order" : "qa-order",
          orderNumber: "PBS-QA",
          totalAmount: "8800",
          paymentStatus: scenario === "unconfirmed" ? "UNPAID" : "PAID",
        },
      }),
    );
    await page.goto("/checkout");
    await page
      .getByRole("button", {
        name:
          scenario === "already-paid"
            ? "Retry payment"
            : "Check payment status",
        exact: true,
      })
      .click();
    if (scenario === "already-paid") {
      await expect(
        page.getByRole("heading", { name: "Payment successful" }),
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
          ),
        )
        .toBe(0);
    } else {
      await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
        scenario === "unconfirmed" ? "not confirmed" : "could not match",
      );
      await page.getByRole("button", { name: "Close payment status" }).click();
      await expect(page).toHaveURL(/\/checkout$/);
      expect(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("polaroidsbysolly-cart")!).length,
        ),
      ).toBe(1);
    }
  });
}

test("floating Polaroids are visible on mobile", async ({ page }) => {
  await setup(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const photos = page.getByTestId("mobile-hero-polaroids").locator("img");
  await expect(photos).toHaveCount(4);
  for (const photo of await photos.all()) {
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
});

test("WhatsApp help prepares product and cart context without exposing photo links", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/polaroids");
  let href = await page
    .getByRole("link", { name: "Help with ordering" })
    .getAttribute("href");
  expect(new URL(href!).searchParams.get("text")).toContain("Polaroid prints");
  await album(page);
  href = await page
    .getByRole("link", { name: "Help with my order" })
    .getAttribute("href");
  const message = new URL(href!).searchParams.get("text")!;
  expect(message).toContain("cart");
  expect(message).toContain("Memory Photo Album × 1");
  expect(message).not.toContain("http");
  expect(message).not.toContain("blob:");
});

test("photo drafts can be cleared and expired drafts are not restored", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/products/polaroids");
  const photo = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 20;
    c.height = 30;
    return c.toDataURL().split(",")[1];
  });
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "draft.png",
      mimeType: "image/png",
      buffer: Buffer.from(photo, "base64"),
    });
  await page.getByRole("button", { name: "Clear draft", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve) => {
          const r = indexedDB.open("pbs-photo-drafts", 1);
          r.onsuccess = () => resolve(r.result);
        });
        const count = await new Promise<number>((resolve) => {
          const r = db
            .transaction("drafts")
            .objectStore("drafts")
            .get("polaroids:POLAROID-STANDARD");
          r.onsuccess = () => resolve(r.result?.value.length ?? -1);
        });
        db.close();
        return count;
      }),
    )
    .toBe(0);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("pbs-photo-drafts", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(
        {
          savedAt: Date.now() - 25 * 3600000,
          value: [{ id: "expired-photo", src: "expired", quantity: 1 }],
        },
        "polaroids:POLAROID-STANDARD",
      );
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Choose photos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear draft", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByAltText("Your cropped photo")).toHaveCount(0);
});

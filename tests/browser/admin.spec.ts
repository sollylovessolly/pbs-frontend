import { test, expect, type Page, type Route } from "@playwright/test";
const admin = { id: "admin1", name: "Solly", email: "studio@example.com" };
const resource = {
  id: "r1",
  name: "Instax film",
  sku: "FILM",
  unit: "SHEET",
  category: "MATERIAL",
  currentStock: 3,
  averageUnitCost: "200",
  lowStockThreshold: 10,
  isActive: true,
  movements: [],
};
const variant = {
  id: "v1",
  name: "Classic album",
  sku: "ALBUM-1",
  sellingPrice: "5000",
  outsourcedUnitCost: "1000",
  isActive: true,
  inStock: true,
  availableQuantity: 20,
  tracksStock: true,
};
const product = {
  id: "p1",
  name: "Memory albums",
  slug: "albums",
  category: "ALBUM",
  isActive: true,
  variants: [variant],
};
function order(paid = false) {
  return {
    id: "o1",
    orderNumber: "PBS-2026-001",
    source: "WHATSAPP",
    status: "PENDING",
    paymentStatus: paid ? "PAID" : "UNPAID",
    totalAmount: "8800",
    subtotal: "5000",
    deliveryFee: "3800",
    discount: "0",
    createdAt: "2026-09-15T10:00:00Z",
    customer: {
      id: "c1",
      name: "Ada Bello",
      email: "ada@example.com",
      phone: "08012345678",
    },
    deliveryState: "Lagos",
    deliveryAddress: "12 Memory Street, Ikeja",
    actualDeliveryCost: "3000",
    adminNote: "Pack with care",
    items: [
      {
        id: "i1",
        quantity: 1,
        unitPriceSnapshot: "5000",
        totalPriceSnapshot: "5000",
        variant: { ...variant, product },
        customization: {},
      },
    ],
    statusHistory: [{ status: "PENDING", changedAt: "2026-09-15T10:00:00Z" }],
    payments: [],
  };
}
const paged = (data: unknown[], page = 1, totalPages = 1) => ({
  data,
  pagination: { page, limit: 20, total: data.length, totalPages },
});
type Override = (path: string, route: Route) => Promise<boolean> | boolean;
async function mock(page: Page, override?: Override) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, "");
    if (await override?.(path, route)) return;
    const send = (json: unknown) => route.fulfill({ json });
    if (path === "/auth/admin/me") return send(admin);
    if (path === "/auth/admin/login")
      return send({ accessToken: "mock-test-token", expiresIn: 3600, admin });
    if (path === "/dashboard/summary")
      return send({
        revenue: "150000",
        orderGrossProfit: "90000",
        operatingExpenses: "10000",
        businessProfit: "80000",
        ownerWithdrawals: "5000",
        retainedAfterWithdrawals: "75000",
        paidOrders: 12,
        pendingOrders: 4,
        averageOrderValue: "12500",
        lowStockCount: 1,
        urgentLowStock: [resource],
      });
    if (path === "/dashboard/monthly-profit")
      return send(
        Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          label: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ][i],
          revenue: 10000 + i * 1000,
          grossProfit: 6000,
          expenses: 1000,
          businessProfit: i === 2 ? -2000 : 5000 + i * 300,
        })),
      );
    if (path === "/dashboard/products")
      return send([
        { product: "Memory albums", quantitySold: 12, revenue: "60000" },
      ]);
    if (path === "/dashboard/sources")
      return send([{ source: "WHATSAPP", orders: 12, revenue: "60000" }]);
    if (path === "/orders") return send(paged([order()]));
    if (path === "/orders/o1") return send(order());
    if (path === "/products") return send([product]);
    if (path === "/products/p1") return send(product);
    if (path === "/variants") return send([{ ...variant, product }]);
    if (path === "/resources") return send([resource]);
    if (path === "/resources/r1") return send(resource);
    if (path === "/delivery-rates")
      return send([{ state: "Lagos", fee: "3800", isActive: true }]);
    if (path === "/suppliers")
      return send(paged([{ id: "s1", name: "Film supplier", isActive: true }]));
    if (path === "/customers")
      return send(
        paged([
          {
            id: "c1",
            name: "Ada Bello",
            phone: "08012345678",
            totalOrders: 1,
            totalSpent: "8800",
          },
        ]),
      );
    if (path === "/expenses/summary")
      return send({
        total: 2000,
        byCategory: [{ category: "DATA", amount: 2000 }],
      });
    if (path === "/owner-withdrawals/summary")
      return send({ totalWithdrawn: 3000, count: 1 });
    if (
      ["/expenses", "/owner-withdrawals", "/purchases", "/payments"].includes(
        path,
      )
    )
      return send(paged([]));
    return route.fulfill({
      status: 404,
      json: { message: "Not found in test fixtures" },
    });
  });
}
async function seed(page: Page) {
  await page.addInitScript(
    (a) =>
      sessionStorage.setItem(
        "pbs-admin-session-v1",
        JSON.stringify({
          accessToken: "mock-test-token",
          expiresAt: Date.now() + 3600000,
          admin: a,
        }),
      ),
    admin,
  );
}
async function login(page: Page) {
  await page.getByLabel("Email address").fill(admin.email);
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in to your studio" }).click();
}
test("protected routes wait for authentication; login errors and success, restoration and logout", async ({
  page,
}) => {
  let protectedCalls = 0,
    fail = true;
  await mock(page, async (path, r) => {
    if (path === "/auth/admin/login" && fail) {
      await r.fulfill({
        status: 401,
        json: { message: "Incorrect email or password" },
      });
      return true;
    }
    if (path === "/orders") protectedCalls++;
    return false;
  });
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/admin\/login/);
  expect(protectedCalls).toBe(0);
  await login(page);
  await expect(page.locator(".admin-root").getByRole("alert")).toContainText(
    "Incorrect email",
  );
  fail = false;
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Orders", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Orders", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Let’s get to work." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("pbs-admin-session-v1")),
  ).toBeNull();
});
test("401 clears restored session and shows sign-in without private content", async ({
  page,
}) => {
  await seed(page);
  await mock(page, async (path, r) => {
    if (path === "/auth/admin/me") {
      await r.fulfill({ status: 401, json: { message: "Expired" } });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/expired=1/);
  await expect(
    page.getByText("Your session expired. Please sign in again."),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("pbs-admin-session-v1")),
  ).toBeNull();
});
test("desktop dashboard shows financial data, low stock and retry states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  let fail = true;
  await mock(page, async (path, r) => {
    if (path === "/dashboard/summary" && fail) {
      await r.fulfill({ status: 503, json: { message: "private failure" } });
      return true;
    }
    return false;
  });
  await page.goto("/admin");
  await expect(page.locator(".admin-root").getByRole("alert")).toContainText(
    "temporarily unavailable",
  );
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("₦150,000.00", { exact: true })).toBeVisible();
  await expect(page.getByText("Instax film", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent orders" }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/pbs-admin-desktop.png", fullPage: true });
});
test("mobile navigation, order cards, detail and forms fit 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed(page);
  await mock(page);
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Orders", exact: true })
    .click();
  await expect(page.locator(".adm-mobile-card").first()).toBeVisible();
  await page.getByRole("link", { name: "View details" }).click();
  await expect(
    page.getByRole("heading", { name: "PBS-2026-001" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/pbs-admin-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Record transfer / OPay" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.getBoundingClientRect().width <= innerWidth),
  ).toBe(true);
});
test("order filters reset pagination and serialize status/search", async ({
  page,
}) => {
  await seed(page);
  let last = "";
  await mock(page, async (path, r) => {
    if (path === "/orders") {
      last = r.request().url();
      await r.fulfill({ json: paged([order()], 2, 3) });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders?page=2");
  await page.getByLabel("Status", { exact: true }).selectOption("PACKING");
  await expect(page).toHaveURL(/page=1/);
  await expect.poll(() => last).toContain("status=PACKING");
  await page.getByLabel("Search", { exact: true }).fill("Ada & friends");
  await expect
    .poll(() => new URL(last).searchParams.get("search"))
    .toBe("Ada & friends");
});
test("manual order sends source, SKU, quantity and delivery to the API", async ({
  page,
}) => {
  await seed(page);
  let body: Record<string, unknown> | undefined;
  await mock(page, async (path, r) => {
    if (path === "/orders/manual") {
      body = r.request().postDataJSON();
      await r.fulfill({ json: order() });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders/new");
  await page.getByLabel("Customer name").fill("Ada Bello");
  await page.getByLabel("Phone number").fill("08012345678");
  await page.getByLabel("State", { exact: true }).selectOption("Lagos");
  await page.getByLabel("Delivery address").fill("12 Memory Street");
  await page.getByLabel("Item 1", { exact: true }).selectOption("ALBUM-1");
  await page.getByRole("button", { name: "Create order & review" }).click();
  await expect(page).toHaveURL(/admin\/orders\/o1/);
  expect(body).toMatchObject({
    source: "WHATSAPP",
    customer: { name: "Ada Bello", phone: "08012345678" },
    delivery: { state: "Lagos", address: "12 Memory Street" },
    items: [{ variantSku: "ALBUM-1", quantity: 1 }],
  });
});
test("manual payment requires receipt confirmation and suppresses duplicate submissions", async ({
  page,
}) => {
  await seed(page);
  let calls = 0;
  let body: unknown;
  await mock(page, async (path, r) => {
    if (path === "/orders/o1/manual-payment") {
      calls++;
      body = r.request().postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 300));
      await r.fulfill({ json: { success: true } });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders/o1");
  await page.getByRole("button", { name: "Record transfer / OPay" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Method", { exact: true }).selectOption("TRANSFER");
  await dialog
    .getByRole("button", { name: "Confirm received payment" })
    .click();
  expect(calls).toBe(0);
  await dialog.getByRole("checkbox").check();
  await dialog.locator("form").evaluate((f) => {
    (f as HTMLFormElement).requestSubmit();
    (f as HTMLFormElement).requestSubmit();
  });
  await expect(dialog).not.toBeVisible();
  expect(calls).toBe(1);
  expect(body).toEqual({ method: "TRANSFER" });
});
for (const restore of [false, true])
  test(`cancellation confirms explicit inventory restoration: ${restore}`, async ({
    page,
  }) => {
    await seed(page);
    let body: unknown;
    await mock(page, async (path, r) => {
      if (path === "/orders/o1") {
        await r.fulfill({ json: order(true) });
        return true;
      }
      if (path === "/orders/o1/cancel") {
        body = r.request().postDataJSON();
        await r.fulfill({ json: { success: true } });
        return true;
      }
      return false;
    });
    await page.goto("/admin/orders/o1");
    await page
      .getByRole("button", { name: "Cancel order", exact: true })
      .click();
    const d = page.getByRole("dialog");
    await d.getByLabel("Cancellation reason").fill("Customer changed plans");
    if (restore) await d.getByRole("checkbox").check();
    await d.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(d).not.toBeVisible();
    expect(body).toEqual({
      reason: "Customer changed plans",
      restoreInventory: restore,
    });
  });
test("status update uses PATCH and refreshes the order", async ({ page }) => {
  await seed(page);
  let status = "PENDING";
  await mock(page, async (path, r) => {
    if (path === "/orders/o1/status") {
      expect(r.request().method()).toBe("PATCH");
      status = r.request().postDataJSON().status;
      await r.fulfill({ json: { success: true } });
      return true;
    }
    if (path === "/orders/o1") {
      await r.fulfill({ json: { ...order(), status } });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders/o1");
  await page.getByRole("button", { name: "Update order status" }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("combobox").selectOption("PACKING");
  await d.getByRole("button", { name: "Save status" }).click();
  await expect(d).not.toBeVisible();
  expect(status).toBe("PACKING");
});
test("restock validates positive quantities and refreshes stock", async ({
  page,
}) => {
  await seed(page);
  let stock = 3,
    calls = 0;
  await mock(page, async (path, r) => {
    if (path === "/resources/r1/restock") {
      calls++;
      expect(r.request().postDataJSON()).toMatchObject({
        quantity: 5,
        unitCost: 200,
      });
      stock = 8;
      await r.fulfill({ json: { ...resource, currentStock: stock } });
      return true;
    }
    if (path === "/resources/r1") {
      await r.fulfill({ json: { ...resource, currentStock: stock } });
      return true;
    }
    return false;
  });
  await page.goto("/admin/inventory/r1");
  await page.getByRole("button", { name: "+ Restock", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Quantity").fill("0");
  await d.getByLabel("Total amount paid").fill("1000");
  await d.getByRole("button", { name: "Add stock", exact: true }).click();
  expect(calls).toBe(0);
  await d.getByLabel("Quantity").fill("5");
  await d.getByRole("button", { name: "Add stock", exact: true }).click();
  await expect(d).not.toBeVisible();
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();
});
test("product create and deactivate use exact DTO and confirmation", async ({
  page,
}) => {
  await seed(page);
  const writes: Array<{ method: string; body: unknown }> = [];
  await mock(page, async (path, r) => {
    if (path.startsWith("/products") && r.request().method() !== "GET") {
      writes.push({
        method: r.request().method(),
        body: r.request().postData() ? r.request().postDataJSON() : null,
      });
      await r.fulfill({ json: product });
      return true;
    }
    return false;
  });
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "Add product" }).click();
  let d = page.getByRole("dialog");
  await d.getByLabel("Name", { exact: false }).fill("Memory albums");
  await d.getByLabel("Slug").fill("albums");
  await d.getByLabel("Category", { exact: true }).selectOption("ALBUM");
  await d.getByRole("button", { name: "Save changes" }).click();
  await expect(d).not.toBeVisible();
  expect(writes[0]).toMatchObject({
    method: "POST",
    body: { name: "Memory albums", slug: "albums", category: "ALBUM" },
  });
  await page
    .locator(".adm-desktop-table")
    .getByRole("button", { name: "Deactivate" })
    .click();
  expect(writes).toHaveLength(1);
  d = page.getByRole("dialog");
  await d.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(d).not.toBeVisible();
  expect(writes[1].method).toBe("DELETE");
});
test("variant edit preserves product reference and updates price", async ({
  page,
}) => {
  await seed(page);
  let body: unknown;
  await mock(page, async (path, r) => {
    if (path === "/variants/v1" && r.request().method() === "PATCH") {
      body = r.request().postDataJSON();
      await r.fulfill({ json: variant });
      return true;
    }
    return false;
  });
  await page.goto("/admin/variants");
  await page
    .locator(".adm-desktop-table")
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Selling price").fill("6000");
  await d.getByRole("button", { name: "Save changes" }).click();
  await expect(d).not.toBeVisible();
  expect(body).toMatchObject({ sellingPrice: 6000 });
});
test("purchase records unit conversion and total cost after confirmation", async ({
  page,
}) => {
  await seed(page);
  let body: unknown;
  await mock(page, async (path, r) => {
    if (path === "/purchases" && r.request().method() === "POST") {
      body = r.request().postDataJSON();
      await r.fulfill({ json: { id: "pu1" } });
      return true;
    }
    if (path === "/purchases/pu1") {
      await r.fulfill({ json: { id: "pu1", totalCost: 4000, items: [] } });
      return true;
    }
    return false;
  });
  await page.goto("/admin/purchases/new");
  await page.getByLabel("Resource 1", { exact: true }).selectOption("r1");
  await page.getByLabel("Number of purchase units").fill("2");
  await page.getByLabel("Base units per purchase unit").fill("10");
  await page.getByLabel("Total paid for this line").fill("4000");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Confirm purchase & update stock" })
    .click();
  await expect(page).toHaveURL(/purchases\/pu1/);
  expect(body).toMatchObject({
    items: [
      {
        resourceId: "r1",
        purchaseQuantity: 2,
        purchaseUnit: "PACK",
        unitsPerPurchaseUnit: 10,
        totalCost: 4000,
      },
    ],
  });
});
for (const entity of ["expenses", "withdrawals"])
  test(`${entity} creation posts correct financial fields`, async ({
    page,
  }) => {
    await seed(page);
    let body: unknown;
    const endpoint = entity === "expenses" ? "/expenses" : "/owner-withdrawals";
    await mock(page, async (path, r) => {
      if (path === endpoint && r.request().method() === "POST") {
        body = r.request().postDataJSON();
        await r.fulfill({ json: { id: "new" } });
        return true;
      }
      return false;
    });
    await page.goto(`/admin/${entity}`);
    await page
      .getByRole("button", {
        name: entity === "expenses" ? "Add expense" : "Add withdrawal",
      })
      .click();
    const d = page.getByRole("dialog");
    await d.getByLabel("Amount").fill("3000");
    if (entity === "expenses") {
      await d.getByLabel("Title").fill("Internet");
      await d.getByLabel("Category", { exact: true }).selectOption("DATA");
      await d.getByLabel("Expense date").fill("2026-09-01T10:00");
    }
    await d.getByRole("button", { name: "Save changes" }).click();
    await expect(d).not.toBeVisible();
    expect(body).toMatchObject({ amount: 3000 });
  });

test("inventory offers named SKU choices and adds stock without creating duplicates on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await seed(page);
  let calls = 0;
  await mock(page, async (path, r) => {
    if (path === "/resources/r1/restock") {
      calls++;
      expect(r.request().postDataJSON()).toEqual({
        quantity: 10,
        unitCost: 200,
      });
      await new Promise((resolve) => setTimeout(resolve, 200));
      await r.fulfill({ json: resource });
      return true;
    }
    if (path === "/resources" && r.request().method() === "POST")
      throw new Error("Existing stock must not create another item");
    return false;
  });
  await page.goto("/admin/inventory");
  await page.getByRole("button", { name: "+ Add stock", exact: true }).click();
  const d = page.getByRole("dialog");
  await expect(d.getByLabel("Item / SKU")).toContainText("Instax film — FILM");
  await d.getByLabel("Item / SKU").selectOption("r1");
  await d.getByLabel("Quantity added").fill("10");
  await d.getByLabel("Total amount paid").fill("2000");
  expect(await d.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({
    path: "/tmp/pbs-inventory-simple-mobile.png",
    fullPage: true,
  });
  await d.locator("form").evaluate((f) => {
    (f as HTMLFormElement).requestSubmit();
    (f as HTMLFormElement).requestSubmit();
  });
  await expect(d).not.toBeVisible();
  expect(calls).toBe(1);
});
test("new inventory item gets an automatic SKU and converts total cost to unit cost", async ({
  page,
}) => {
  await seed(page);
  let body: Record<string, unknown> | undefined;
  let fail = true;
  await mock(page, async (path, r) => {
    if (path === "/resources" && r.request().method() === "POST") {
      body = r.request().postDataJSON();
      await r.fulfill(
        fail
          ? { status: 503, json: { message: "Unavailable" } }
          : { json: { id: "r2", ...body } },
      );
      return true;
    }
    return false;
  });
  await page.goto("/admin/inventory");
  await page.getByRole("button", { name: "+ Add stock", exact: true }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Item / SKU").selectOption("new");
  await d.getByLabel("Item name").fill("Gift boxes");
  await d.getByLabel("What is it used for?").selectOption("PACKAGING");
  await d.getByLabel("Quantity added").fill("20");
  await d.getByLabel("Total amount paid").fill("4000");
  await d.getByRole("button", { name: "Create item & add stock" }).click();
  await expect(d.getByRole("alert")).toBeVisible();
  await expect(d.getByLabel("Item name")).toHaveValue("Gift boxes");
  fail = false;
  await d.getByRole("button", { name: "Create item & add stock" }).click();
  await expect(d).not.toBeVisible();
  expect(body).toEqual({
    name: "Gift boxes",
    sku: "SUP-GIFT-BOXES",
    category: "PACKAGING",
    unit: "PIECE",
    currentStock: 20,
    averageUnitCost: 200,
    lowStockThreshold: 5,
    isActive: true,
  });
});
test("shop setup stays out of the way until expanded", async ({ page }) => {
  await seed(page);
  await mock(page);
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Studio navigation" });
  await expect(
    nav.getByRole("link", { name: "Inventory", exact: true }),
  ).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Product options", exact: true }),
  ).not.toBeVisible();
  await nav.getByText("Shop setup", { exact: true }).click();
  await nav.getByRole("link", { name: "Product options", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Product options", exact: true }),
  ).toBeVisible();
});

test("current public catalogue without isActive populates manual order options", async ({
  page,
}) => {
  await seed(page);
  await mock(page, async (path, r) => {
    if (path === "/products") {
      const current = JSON.parse(JSON.stringify(product));
      delete current.isActive;
      for (const v of current.variants) delete v.isActive;
      await r.fulfill({ json: [current] });
      return true;
    }
    return false;
  });
  await page.goto("/admin/orders/new");
  await expect(page.getByLabel("Item 1", { exact: true })).toContainText(
    "Classic album",
  );
  await page.getByLabel("Item 1", { exact: true }).selectOption("ALBUM-1");
  await expect(page.getByLabel("Item 1", { exact: true })).toHaveValue(
    "ALBUM-1",
  );
});

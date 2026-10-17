const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  apiGet,
  apiPost,
  apiUpload,
  queryString,
} = require("../src/lib/api/client.ts");
const {
  uploadProductionFile,
  initializePayment,
  verifyPayment,
  findTrackedOrders,
} = require("../src/lib/api/index.ts");
const {
  available,
  validateCart,
  safeUrl,
} = require("../src/lib/commerce/catalogue.ts");
const { orderItems } = require("../src/lib/commerce/checkout.ts");
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const variant = {
  sku: "SKU",
  name: "Print",
  sellingPrice: "3500",
  isActive: true,
  inStock: true,
  availableQuantity: 3,
};
const products = [{ isActive: true, variants: [variant] }];
test("API parses JSON and serializes queries and JSON bodies", async () => {
  global.fetch = async (url, init) => {
    assert.ok(url.endsWith("/orders?a=a+b&count=2"));
    assert.equal(init.body, '{"name":"Test"}');
    return Response.json({ id: "order" });
  };
  assert.deepEqual(
    await apiPost(
      "/orders" + queryString({ a: "a b", count: 2, skip: undefined }),
      { name: "Test" },
    ),
    { id: "order" },
  );
});
test("API handles empty responses, validation, server errors and invalid success data", async () => {
  global.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await apiGet("/empty"), undefined);
  global.fetch = async () =>
    Response.json(
      { message: ["Invalid code", "Try another"] },
      { status: 400 },
    );
  await assert.rejects(apiGet("/fail"), /Invalid code Try another/);
  global.fetch = async () =>
    Response.json({ message: "secret provider stack" }, { status: 500 });
  await assert.rejects(apiGet("/fail"), /temporarily unavailable/);
  global.fetch = async () =>
    new Response("<html>Bad gateway</html>", { status: 502 });
  await assert.rejects(apiGet("/fail"), /temporarily unavailable/);
  global.fetch = async () => new Response("<html>Unexpected</html>");
  await assert.rejects(apiGet("/fail"), /unexpected response/);
});
test("network errors are friendly and abort remains an abort", async () => {
  global.fetch = async () => {
    throw new Error("network internals");
  };
  await assert.rejects(apiGet("/fail"), /could not reach/);
  const c = new AbortController();
  c.abort();
  global.fetch = async () => {
    throw new DOMException("Aborted", "AbortError");
  };
  await assert.rejects(apiGet("/fail", c.signal), { name: "AbortError" });
});
test("multipart leaves boundary to browser and validates before sending", async () => {
  let calls = 0;
  global.fetch = async (_, init) => {
    calls++;
    assert.ok(init.body instanceof FormData);
    assert.equal(init.headers["Content-Type"], undefined);
    assert.equal(init.body.get("purpose"), "POLAROID_FINAL");
    return Response.json({
      key: "production/x",
      url: "https://example.com/file",
    });
  };
  await assert.rejects(
    uploadProductionFile(
      new File(["x"], "bad.jpg", { type: "image/jpeg" }),
      "POLAROID_FINAL",
    ),
    /format/,
  );
  await assert.rejects(
    uploadProductionFile(
      new File([new Uint8Array(2_000_001)], "large.png", { type: "image/png" }),
      "POLAROID_PREVIEW",
    ),
    /2 MB/,
  );
  assert.equal(calls, 0);
  await uploadProductionFile(
    new File(["png"], "good.png", { type: "image/png" }),
    "POLAROID_FINAL",
  );
  assert.equal(calls, 1);
});
test("failed upload can be retried", async () => {
  let calls = 0;
  global.fetch = async () =>
    ++calls === 1
      ? new Response(null, { status: 503 })
      : Response.json({ url: "https://example.com/file" });
  const form = new FormData();
  await assert.rejects(apiUpload("/uploads", form));
  assert.equal(
    (await apiUpload("/uploads", form)).url,
    "https://example.com/file",
  );
});
test("stock respects inactive, zero, null and aggregate quantities", () => {
  assert.equal(available({ ...variant, availableQuantity: null }), true);
  assert.equal(available({ ...variant, availableQuantity: 0 }), false);
  assert.equal(available({ ...variant, isActive: false }), false);
  assert.doesNotThrow(() =>
    validateCart([{ variantSku: "SKU", quantity: 3 }], products),
  );
  assert.throws(
    () =>
      validateCart(
        [
          { variantSku: "SKU", quantity: 2 },
          { variantSku: "SKU", quantity: 2 },
        ],
        products,
      ),
    /Only 3/,
  );
  assert.throws(() => validateCart([{ quantity: 1 }], products), /older cart/);
  assert.throws(
    () => validateCart([{ variantSku: "SKU", quantity: 1.5 }], products),
    /valid quantity/,
  );
});
test("every supported category produces only backend fields, never prices", () => {
  for (const [productType, customization] of [
    [
      "polaroid",
      {
        finalPngUrl: "https://example.com/f",
        previewUrl: "https://example.com/p",
      },
    ],
    ["photostrip", { finalPngUrl: "https://example.com/f" }],
    ["vintage-letter", { finalPdfUrl: "https://example.com/f" }],
    ["phone-case", { package: "WITH_POLAROID" }],
    ["album", {}],
  ]) {
    const [item] = orderItems([
      {
        productType,
        variantSku: "SKU",
        quantity: 2,
        unitPrice: 1,
        customization: { ...customization, internal: "discard" },
      },
    ]);
    assert.deepEqual(item, {
      variantSku: "SKU",
      quantity: 2,
      ...(productType === "album" ? {} : { customization }),
    });
  }
  assert.throws(
    () =>
      orderItems([
        {
          productType: "polaroid",
          variantSku: "SKU",
          quantity: 1,
          customization: {},
        },
      ]),
    /uploading/,
  );
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("https://user:secret@example.com"), null);
});
test("payment uses existing order and backend reference; tracking empty remains empty", async () => {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push([url, JSON.parse(init.body)]);
    return Response.json(
      url.endsWith("/tracking/orders")
        ? []
        : { paymentStatus: "PAID", reference: "ref" },
    );
  };
  await initializePayment("existing-order");
  await verifyPayment("ref");
  assert.deepEqual(await findTrackedOrders("08012345678"), []);
  assert.deepEqual(
    calls.map(([url, body]) => [new URL(url).pathname, body]),
    [
      ["/api/payments/initialize", { orderId: "existing-order" }],
      ["/api/payments/verify", { reference: "ref" }],
      ["/api/tracking/orders", { phone: "08012345678" }],
    ],
  );
});

test("public catalogue accepts omitted active flags without hiding products or overriding stock", async () => {
  const { getProducts, getProduct } = require("../src/lib/api/index.ts");
  const { normalizeCatalogue } = require("../src/lib/api/catalogue.ts");
  const current = {
    id: "p1",
    name: "Prints",
    slug: "polaroids",
    category: "POLAROID",
    description: "Prints",
    variants: [
      {
        id: "v1",
        sku: "PRINT",
        name: "Standard",
        sellingPrice: "3500",
        tracksStock: true,
        inStock: false,
        availableQuantity: 0,
        reasonIfUnavailable: "Temporarily unavailable",
      },
    ],
  };
  global.fetch = async () => new Response(JSON.stringify([current]));
  const products = await getProducts();
  assert.equal(products[0].isActive, true);
  assert.equal(products[0].variants[0].isActive, true);
  assert.equal(available(products[0].variants[0]), false);
  assert.equal(products[0].variants[0].sellingPrice, "3500");
  global.fetch = async () => new Response(JSON.stringify(current));
  assert.equal((await getProduct("p1")).isActive, true);
  const old = normalizeCatalogue([
    {
      ...current,
      isActive: false,
      variants: [{ ...current.variants[0], isActive: false }],
    },
  ]);
  assert.equal(old[0].isActive, false);
  assert.equal(old[0].variants[0].isActive, false);
});

test("catalogue keeps the requested category order without changing source data", () => {
  const { normalizeCatalogue } = require("../src/lib/api/catalogue.ts");
  const categories = [
    "ALBUM",
    "PHONE_CASE",
    "PHOTOSTRIP",
    "VINTAGE_LETTER",
    "POLAROID",
  ];
  const raw = categories.map((category) => ({ category, variants: [] }));
  assert.deepEqual(
    normalizeCatalogue(raw).map((p) => p.category),
    ["POLAROID", "PHOTOSTRIP", "VINTAGE_LETTER", "PHONE_CASE", "ALBUM"],
  );
  assert.deepEqual(
    raw.map((p) => p.category),
    categories,
  );
});
test("artwork preparation limits concurrent work and clears stale visible jobs between visits", async () => {
  const {
    prepareInBatches,
    beginUploadSession,
    getUploadJobs,
  } = require("../src/lib/commerce/production.ts");
  let active = 0,
    max = 0;
  const result = await prepareInBatches([1, 2, 3, 4], async (n) => {
    active++;
    max = Math.max(max, active);
    await new Promise((r) => setTimeout(r, 5));
    active--;
    return n * 2;
  });
  assert.deepEqual(result, [2, 4, 6, 8]);
  assert.equal(max, 2);
  beginUploadSession();
  assert.deepEqual(getUploadJobs(), []);
});

test("cart recovery ignores malformed lines and keeps valid legacy lines for checkout validation", () => {
  const { restoreCart, cartPreview } = require("../src/lib/commerce/cart.ts");
  const valid = {
    id: "1",
    name: "Phone case",
    productType: "phone-case",
    previewUrl: "data:image/png;base64,test",
    unitPrice: 5500,
    quantity: 1,
    editHref: "/products/phone-cases",
  };
  assert.deepEqual(
    restoreCart([
      null,
      {},
      { ...valid, quantity: -1 },
      { ...valid, unitPrice: "5000" },
      valid,
    ]),
    [valid],
  );
  assert.equal(cartPreview(valid), valid.previewUrl);
  assert.equal(
    cartPreview({ ...valid, previewUrl: "https://example.com/art.png" }),
    "https://example.com/art.png",
  );
});

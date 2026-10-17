const test = require("node:test");
const assert = require("node:assert/strict");
const {
  giftPackages,
  validatePackageItems,
  cartSubtotal,
  validateCartPackages,
} = require("../src/lib/commerce/packages.ts");
const { orderItems } = require("../src/lib/commerce/checkout.ts");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
function parts(p) {
  return [
    ["polaroid", p.polaroids],
    ["phone-case", p.cases],
    ["vintage-letter", 1],
    ["photostrip", p.strips],
  ]
    .filter(([, n]) => n)
    .map(([productType, quantity], i) => ({
      id: String(i),
      productType,
      quantity,
      unitPrice: 99999,
      variantSku: "SKU-" + i,
      customization: {
        package: "CASE_ONLY",
        finalPngUrl: "https://example.com/file",
        previewUrl: "https://example.com/preview",
        finalPdfUrl: "https://example.com/letter",
      },
    }));
}
test("all six packages require exact contents and use their fixed cart price", () => {
  for (const p of giftPackages) {
    const items = parts(p);
    assert.equal(validatePackageItems(p.id, items).price, p.price);
    const grouped = items.map((i) => ({
      ...i,
      packageId: p.id,
      packageGroupId: "group",
    }));
    validateCartPackages(grouped);
    assert.equal(cartSubtotal(grouped), p.price);
    assert.ok(
      orderItems(grouped).every(
        (i) => i.packageId === p.id && i.packageGroupId === "group",
      ),
    );
    assert.throws(() => validatePackageItems(p.id, items.slice(1)));
  }
});
test("rejects incomplete groups and keeps ordinary products outside bundle pricing", () => {
  const p = giftPackages[0];
  const grouped = parts(p).map((i) => ({
    ...i,
    packageId: p.id,
    packageGroupId: "group",
  }));
  assert.equal(
    cartSubtotal([...grouped, { unitPrice: 5000, quantity: 2 }]),
    31000,
  );
  assert.throws(() => validateCartPackages(grouped.slice(1)));
  assert.throws(() =>
    validateCartPackages([{ ...grouped[0], packageGroupId: undefined }]),
  );
});
test("gallery generation discovers photos, chooses covers, and tags only matching product photos", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pbs-gallery-test-"));
  try {
    for (const album of ["product-showcase", "oriya-living"])
      fs.mkdirSync(path.join(dir, "public/images/gallery", album), {
        recursive: true,
      });
    for (const name of [
      "vintage-letters-amber.jpg",
      "polaroids-birthday.webp",
      "cover.jpg",
      "ignored.txt",
    ])
      fs.writeFileSync(
        path.join(dir, "public/images/gallery/product-showcase", name),
        "",
      );
    fs.writeFileSync(
      path.join(
        dir,
        "public/images/gallery/oriya-living/vintage-letters-event.jpg",
      ),
      "",
    );
    const result = spawnSync(
      process.execPath,
      [path.resolve("scripts/generate-gallery.mjs")],
      { cwd: dir, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const data = JSON.parse(
      fs.readFileSync(
        path.join(dir, "src/data/gallery.generated.json"),
        "utf8",
      ),
    );
    assert.equal(data.length, 7);
    assert.equal(data[0].photos.length, 3);
    assert.equal(
      data[0].cover.url,
      "/images/gallery/product-showcase/cover.jpg",
    );
    assert.equal(
      data[0].photos.filter((p) => p.category === "vintage-letters").length,
      1,
    );
    assert.equal(data[1].photos[0].category, null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("package quotas count only the matching draft and unfinished items cannot enter checkout", () => {
  const {
    packageQuantity,
    packageStepRemaining,
  } = require("../src/lib/commerce/packages.ts");
  const p = giftPackages[0];
  const rows = parts(p).map((i) => ({
    ...i,
    packageDraftId: "draft-a",
    packageDraftTemplateId: p.id,
  }));
  assert.equal(packageQuantity(p.id, "polaroid"), 2);
  assert.equal(packageStepRemaining(p.id, "draft-a", "polaroid", rows), 0);
  assert.equal(packageStepRemaining(p.id, "draft-b", "polaroid", rows), 2);
  assert.equal(
    packageStepRemaining("birthday-mini", "draft-a", "polaroid", rows),
    2,
  );
  assert.throws(() => orderItems(rows), /complete your gift package/);
});

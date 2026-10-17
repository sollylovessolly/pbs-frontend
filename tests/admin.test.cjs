const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildFormPayload,
  localDateInput,
} = require("../src/lib/admin/forms.ts");
const {
  safeDestination,
  saveSession,
  clearSession,
  adminRequest,
  setExpiryHandler,
  restoreSession,
} = require("../src/lib/admin/api.ts");
test("admin forms whitelist fields, coerce numbers and reject invalid finance values", () => {
  assert.deepEqual(
    buildFormPayload("CreateOwnerWithdrawalDto", {
      amount: "5000",
      description: "  Personal  ",
      secret: "ignored",
    }),
    { amount: 5000, description: "Personal" },
  );
  assert.throws(
    () => buildFormPayload("RestockResourceDto", { quantity: 0, unitCost: 20 }),
    /quantity/i,
  );
  assert.throws(
    () =>
      buildFormPayload("CreateDiscountDto", {
        code: "gift",
        type: "PERCENTAGE",
        value: "101",
      }),
    /100/,
  );
  assert.throws(
    () =>
      buildFormPayload("CreateExpenseDto", {
        title: "  ",
        category: "DATA",
        amount: 10,
        expenseDate: "2026-09-01T10:00",
      }),
    /required/,
  );
  assert.deepEqual(buildFormPayload("UpdateAdminNoteDto", { adminNote: "" }), {
    adminNote: "",
  });
  assert.equal(
    buildFormPayload("CreateExpenseDto", {
      title: "Internet",
      category: "DATA",
      amount: "2000",
      expenseDate: "2026-09-01T10:00",
    }).expenseDate,
    new Date("2026-09-01T10:00").toISOString(),
  );
  assert.equal(localDateInput("2026-09-01T10:00"), "2026-09-01T10:00");
});
test("admin redirect destinations stay within the admin app", () => {
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/admin\\evil",
    "/adminevil",
    "/admin/login?next=/",
  ])
    assert.equal(safeDestination(path), "/admin");
  assert.equal(safeDestination("/admin/orders?page=2"), "/admin/orders?page=2");
});
test("admin requests require a session, send bearer auth and clear it on 401", async () => {
  const values = new Map();
  global.sessionStorage = {
    setItem: (k, v) => values.set(k, v),
    getItem: (k) => values.get(k),
    removeItem: (k) => values.delete(k),
  };
  const original = global.fetch;
  let calls = 0,
    expired = 0;
  setExpiryHandler(() => expired++);
  clearSession();
  global.fetch = async () => {
    calls++;
    return new Response("{}");
  };
  try {
    await assert.rejects(adminRequest("/orders"), (e) => e.status === 401);
    assert.equal(calls, 0);
    saveSession({
      accessToken: "mock-test-token",
      expiresAt: Date.now() + 60000,
      admin: { id: "a", name: "Solly", email: "test@example.com" },
    });
    assert.ok(restoreSession());
    global.fetch = async (url, init) => {
      assert.equal(init.headers.Authorization, "Bearer mock-test-token");
      return new Response(
        JSON.stringify({ message: ["Invalid session", "Sign in again"] }),
        { status: 401 },
      );
    };
    await assert.rejects(
      adminRequest("/orders"),
      /Invalid session Sign in again/,
    );
    assert.equal(restoreSession(), null);
    assert.equal(expired, 2);
  } finally {
    global.fetch = original;
    setExpiryHandler();
    clearSession();
  }
});

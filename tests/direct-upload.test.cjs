const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  apiRequest,
  apiUploadWithProgress,
} = require("../src/lib/api/client.ts");
const previous = {
  fetch: global.fetch,
  xhr: global.XMLHttpRequest,
  mode: process.env.NEXT_PUBLIC_DIRECT_UPLOADS,
};
afterEach(() => {
  global.fetch = previous.fetch;
  global.XMLHttpRequest = previous.xhr;
  if (previous.mode === undefined)
    delete process.env.NEXT_PUBLIC_DIRECT_UPLOADS;
  else process.env.NEXT_PUBLIC_DIRECT_UPLOADS = previous.mode;
});
function setup() {
  process.env.NEXT_PUBLIC_DIRECT_UPLOADS = "true";
  const uploads = [];
  global.XMLHttpRequest = class {
    upload = {};
    status = 204;
    open(method, url) {
      this.method = method;
      this.url = url;
    }
    send(body) {
      uploads.push({ url: this.url, body });
      this.onload();
      this.onloadend();
    }
    abort() {
      this.onabort();
      this.onloadend();
    }
  };
  return uploads;
}
test("production upload sends bytes to storage and only a token to the API", async () => {
  const uploads = setup();
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Response.json(
      url.endsWith("/uploads/direct")
        ? {
            token: "authorized",
            url: "https://storage.example/private",
            fields: { key: "incoming/one", policy: "signed" },
          }
        : {
            key: "production/one.png",
            url: "https://api.example/api/uploads/files/one",
          },
    );
  };
  const body = new FormData();
  body.append("file", new File(["pixels"], "art.png", { type: "image/png" }));
  body.append("purpose", "POLAROID_FINAL");
  const progress = [];
  await apiUploadWithProgress("/uploads", body, (n) => progress.push(n));
  assert.equal(uploads[0].url, "https://storage.example/private");
  assert.ok(uploads[0].body.get("file") instanceof File);
  assert.equal(calls[0].body.sha256.length, 64);
  assert.deepEqual(calls[1].body, {
    purpose: "POLAROID_FINAL",
    uploadToken: "authorized",
  });
  assert.equal(progress.at(-1), 100);
});
test("gallery grants include admin auth; review photo references remain ordered", async () => {
  const uploads = setup();
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return Response.json(
      url.includes("/uploads/direct")
        ? {
            token: "token-" + uploads.length,
            url: "https://storage.example/private",
            fields: { key: "incoming/one" },
          }
        : { status: "PENDING" },
    );
  };
  const gallery = new FormData();
  gallery.append(
    "file",
    new File(["gallery"], "one.jpg", { type: "image/jpeg" }),
  );
  gallery.append("requestKey", "request");
  await apiRequest("/admin/gallery/uploads", {
    method: "POST",
    headers: { Authorization: "Bearer admin" },
    body: gallery,
  });
  assert.ok(calls[0].url.endsWith("/uploads/direct/admin"));
  assert.equal(calls[0].headers.Authorization, "Bearer admin");
  const review = new FormData();
  review.append("text", "My review");
  review.append("photos", new File(["one"], "one.png", { type: "image/png" }));
  review.append("photos", new File(["two"], "two.png", { type: "image/png" }));
  await apiRequest("/reviews", { method: "POST", body: review });
  assert.deepEqual(calls.at(-1).body, {
    text: "My review",
    uploadTokens: ["token-1", "token-2"],
  });
});

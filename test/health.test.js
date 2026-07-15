const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

process.env.HOUSECALLPRO_API_KEY = "test-key";

const { normalizeAttachmentUrl, startServer } = require("../index");

test("attachment URLs are restricted to approved HTTPS hosts", () => {
  assert.equal(
    normalizeAttachmentUrl("https://drive.google.com/file/d/abc_123/view").toString(),
    "https://drive.google.com/uc?export=download&id=abc_123"
  );
  assert.throws(
    () => normalizeAttachmentUrl("http://127.0.0.1/private"),
    /approved attachment host/
  );
  assert.throws(
    () => normalizeAttachmentUrl("https://drive.google.com.evil.example/file"),
    /approved attachment host/
  );
});

test("health endpoint reports readiness without calling the vendor API", async (t) => {
  const server = startServer(0);
  t.after(() => server.close());
  await once(server, "listening");

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

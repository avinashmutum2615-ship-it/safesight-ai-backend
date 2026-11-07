import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";
delete process.env.GOOGLE_API_KEY;
delete process.env.GEMINI_API_KEY;
let server, base;
before(() => {
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => new Promise((resolve) => server.close(resolve)));
async function req(path, method = "GET", body) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json() };
}
test("private routes reject unauthenticated requests", async () => {
  for (const path of [
    "/auth/me",
    "/appointments",
    "/patients",
    "/admin/staff",
    "/visits/today",
    "/prescriptions/visit/123",
  ])
    assert.equal((await req(path)).status, 401, path);
});
test("public cannot enumerate patient records", async () => {
  for (const path of [
    "/public/patients/search?keyword=a",
    "/public/patients/123",
  ])
    assert.equal((await req(path)).status, 403);
});
test("name and phone are insufficient to alter appointments", async () => {
  for (const path of [
    "/public/appointments/cancel",
    "/public/appointments/reschedule",
  ])
    assert.equal(
      (await req(path, "PATCH", { name: "Test", phone: "9000000000" })).status,
      403,
    );
});
test("AI is optional and staff chat requires authentication", async () => {
  assert.equal(
    (await req("/ai/public/chat", "POST", { message: "Hello" })).status,
    503,
  );
  assert.equal(
    (await req("/ai/doctor/chat", "POST", { message: "Hello" })).status,
    401,
  );
  assert.equal(
    (await req("/ai/receptionist/chat", "POST", { message: "Hello" })).status,
    401,
  );
});
test("health reflects unavailable database", async () =>
  assert.equal((await req("/health")).status, 503));
test("API errors return JSON", async () =>
  assert.equal((await req("/unknown")).body.success, false));
test("login rejects missing fields and object injection without database access", async () => {
  assert.equal((await req("/auth/login", "POST", {})).status, 400);
  assert.equal(
    (
      await req("/auth/login", "POST", {
        email: { $ne: null },
        password: { $ne: null },
      })
    ).status,
    401,
  );
});
test("bad booking input fails before database work", async () => {
  assert.equal(
    (await req("/public/appointments", "POST", { appointmentDate: "bad" }))
      .status,
    400,
  );
  assert.equal(
    (
      await req("/public/appointments", "POST", {
        appointmentDate: "2030-01-07",
        name: "A",
        phone: "x",
        gender: "male",
      })
    ).status,
    400,
  );
});

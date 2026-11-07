import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { hashPassword } from "../utils/hashPassword.js";
import User from "../src/models/User.js";
import Doctor from "../src/models/Doctor.js";
import { slotsFor } from "../src/services/appointment/scheduling.js";
process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters";
process.env.TZ = "Asia/Kolkata";
let db,
  server,
  base,
  admin,
  doctor,
  receptionist,
  doctorId,
  appointmentId,
  visitId;
async function request(path, method = "GET", body, token) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, ...(await response.json()) };
}
before(
  async () => {
    if (process.env.TEST_MONGODB_URI) {
      await mongoose.connect(process.env.TEST_MONGODB_URI, {
        dbName: "safesight_test_" + Date.now(),
      });
    } else {
      db = await MongoMemoryReplSet.create({
        replSet: { count: 1, args: ["--nounixsocket"] },
        binary: { version: "7.0.14" },
      });
      await mongoose.connect(db.getUri());
    }
    const { default: app } = await import("../src/app.js");
    delete process.env.GOOGLE_API_KEY; delete process.env.GEMINI_API_KEY;
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}`;
    await User.create({
      name: "Test Admin",
      email: "admin@test.local",
      phone: "9000000000",
      password: await hashPassword("test-password-123"),
      role: "admin",
    });
  },
  { timeout: 180000 },
);
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState === 1)
    await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (db) await db.stop();
});
test("working days, past dates and overlapping breaks are respected", () => {
  const schedule = {
    status: true,
    startTime: "09:00",
    endTime: "11:00",
    slotDuration: 30,
    workingDays: [1],
    breaks: [{ start: "09:15", end: "09:45" }],
  };
  assert.deepEqual(
    slotsFor(schedule, "2030-01-07", [], new Date("2029-01-01")),
    ["10:00", "10:30"],
  );
  assert.deepEqual(
    slotsFor(schedule, "2030-01-08", [], new Date("2029-01-01")),
    [],
  );
  assert.deepEqual(slotsFor(schedule, "2020-01-01"), []);
  assert.throws(() =>
    slotsFor(
      { ...schedule, slotDuration: 0 },
      "2030-01-07",
      [],
      new Date("2029-01-01"),
    ),
  );
});
test("full clinic workflow and access boundaries", async () => {
  assert.equal((await request("/auth/me")).status, 401);
  assert.equal(
    (await request("/public/patients/search?keyword=a")).status,
    403,
  );
  assert.equal(
    (
      await request("/public/appointments/cancel", "PATCH", {
        name: "A",
        phone: "9000000001",
      })
    ).status,
    403,
  );
  assert.equal(
    (await request("/ai/public/chat", "POST", { message: "Hello" })).status,
    503,
  );
  let r = await request("/auth/login", "POST", {
    email: "admin@test.local",
    password: "test-password-123",
  });
  assert.equal(r.status, 200, JSON.stringify(r));
  admin = r.token;
  r = await request(
    "/admin/doctors/new",
    "POST",
    {
      name: "Doctor One",
      email: "doctor@test.local",
      phone: "9000000001",
      password: "test-password-123",
      specialization: "Ophthalmology",
      consultationFee: 500,
    },
    admin,
  );
  assert.equal(r.status, 201, JSON.stringify(r));
  doctorId = r.doctor.id;
  r = await request(
    "/admin/receptionists/new",
    "POST",
    {
      name: "Reception",
      email: "reception@test.local",
      phone: "9000000002",
      password: "test-password-123",
    },
    admin,
  );
  assert.equal(r.status, 201, JSON.stringify(r));
  doctor = (
    await request("/auth/login", "POST", {
      email: "doctor@test.local",
      password: "test-password-123",
    })
  ).token;
  receptionist = (
    await request("/auth/login", "POST", {
      email: "reception@test.local",
      password: "test-password-123",
    })
  ).token;
  assert.equal(
    (await request("/admin/staff", "GET", undefined, receptionist)).status,
    403,
  );
  r = await request(
    "/doctors/availability",
    "PATCH",
    { status: true, startTime: "09:00", endTime: "17:00" },
    doctor,
  );
  assert.equal(r.status, 200, JSON.stringify(r));
  r = await request("/public/doctors");
  assert.equal(r.doctors.length, 1);
  const date = "2030-01-07";
  r = await request(
    `/public/appointments/slots?doctorId=${doctorId}&date=${date}`,
  );
  assert.equal(r.status, 200);
  assert.ok(r.availableSlots.includes("09:00"));
  const booking = {
    name: "Patient Test",
    phone: "9000000003",
    gender: "female",
    doctor: doctorId,
    appointmentDate: date,
    appointmentTime: "09:00",
    status: "Completed",
  };
  r = await request("/public/appointments", "POST", booking);
  assert.equal(r.status, 201, JSON.stringify(r));
  assert.equal(r.appointment.status, "Pending Confirmation");
  assert.equal(r.appointment.patient, undefined);
  appointmentId = r.appointment.id;
  assert.equal(
    (await request("/public/appointments", "POST", booking)).status,
    400,
  );
  r = await request("/appointments", "GET", undefined, receptionist);
  assert.equal(r.appointments.length, 1);
  r = await request("/patients", "GET", undefined, receptionist);
  assert.equal(r.status, 200, JSON.stringify(r));
  assert.equal(r.patients.length, 1);
  r = await request(
    `/appointments/${appointmentId}`,
    "PATCH",
    { status: "Confirmed" },
    receptionist,
  );
  assert.equal(r.status, 200, JSON.stringify(r));
  r = await request(
    `/appointments/${appointmentId}/check-in`,
    "POST",
    {},
    receptionist,
  );
  assert.equal(r.status, 201, JSON.stringify(r));
  visitId = r.visit.id;
  assert.equal(
    (await request(`/visits/${visitId}/start`, "PATCH", {}, receptionist))
      .status,
    403,
  );
  r = await request(`/visits/${visitId}/start`, "PATCH", {}, doctor);
  assert.equal(r.status, 200, JSON.stringify(r));
  assert.equal(r.visit.status, "In Progress");
  r = await request(
    `/visits/${visitId}/examination`,
    "PUT",
    {
      chiefComplaint: "Test complaint",
      diagnosis: "Test diagnosis",
      visualAcuity: { right: "6/6", left: "6/6" },
    },
    doctor,
  );
  assert.equal(r.status, 200, JSON.stringify(r));
  r = await request(
    "/prescriptions",
    "POST",
    {
      visit: visitId,
      diagnosis: [{ eye: "Both Eyes", disease: "Test finding" }],
      actionPlan: "Test plan",
    },
    doctor,
  );
  assert.equal(r.status, 201, JSON.stringify(r));
  r = await request(
    `/prescriptions/visit/${visitId}`,
    "GET",
    undefined,
    doctor,
  );
  assert.equal(r.status, 200);
  assert.equal(r.prescription.diagnosis[0].disease, "Test finding");
  r = await request(
    `/visits/${visitId}/complete`,
    "PATCH",
    { notes: "Test complete" },
    doctor,
  );
  assert.equal(r.status, 200, JSON.stringify(r));
  r = await request(`/appointments/${appointmentId}`, "GET", undefined, admin);
  assert.equal(r.appointment.status, "Completed");
  assert.equal(
    (
      await request(
        `/visits/${visitId}/examination`,
        "PUT",
        { notes: "late" },
        doctor,
      )
    ).status,
    400,
  );
});
test("simultaneous requests cannot reserve the same slot twice", async () => {
  const body = {
    name: "Concurrent Patient",
    phone: "9000000004",
    gender: "male",
    doctor: doctorId,
    appointmentDate: "2030-01-07",
    appointmentTime: "10:00",
  };
  const results = await Promise.all([
    request("/public/appointments", "POST", body),
    request("/public/appointments", "POST", body),
  ]);
  assert.equal(
    results.filter((r) => r.status === 201).length,
    1,
    JSON.stringify(results),
  );
});

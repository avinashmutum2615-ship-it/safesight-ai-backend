import { test } from "node:test";
import assert from "node:assert/strict";
import {
  slotsFor,
  dateOnly,
  clinicToday,
} from "../src/services/appointment/scheduling.js";
const now = new Date("2029-01-01T00:00:00Z");
const schedule = {
  status: true,
  startTime: "09:00",
  endTime: "11:00",
  slotDuration: 30,
  workingDays: [1],
  breaks: [],
};
test("slots exclude booked times", () =>
  assert.deepEqual(slotsFor(schedule, "2030-01-07", ["09:30"], now), [
    "09:00",
    "10:00",
    "10:30",
  ]));
test("breaks exclude any overlapping slot", () =>
  assert.deepEqual(
    slotsFor(
      { ...schedule, breaks: [{ start: "09:15", end: "09:45" }] },
      "2030-01-07",
      [],
      now,
    ),
    ["10:00", "10:30"],
  ));
test("non-working days and disabled schedules have no slots", () => {
  assert.deepEqual(slotsFor(schedule, "2030-01-08", [], now), []);
  assert.deepEqual(
    slotsFor({ ...schedule, status: false }, "2030-01-07", [], now),
    [],
  );
});
test("past calendar dates cannot be booked", () =>
  assert.deepEqual(slotsFor(schedule, "2020-01-01", [], now), []));
test("same-day past slots are removed using IST", () =>
  assert.deepEqual(
    slotsFor(schedule, "2030-01-07", [], new Date("2030-01-07T04:00:00Z")),
    ["10:00", "10:30"],
  ));
test("invalid dates and schedule durations are rejected", () => {
  for (const date of ["bad", "2030-02-30", "", undefined])
    assert.throws(() => dateOnly(date));
  for (const slotDuration of [0, -1, 1, 1000, 1.5])
    assert.throws(() =>
      slotsFor({ ...schedule, slotDuration }, "2030-01-07", [], now),
    );
});
test("clinic date crosses midnight in India independently of host zone", () =>
  assert.equal(clinicToday(new Date("2030-01-06T20:00:00Z")), "2030-01-07"));
test("invalid hours and reversed windows are rejected", () => {
  assert.throws(() =>
    slotsFor({ ...schedule, startTime: "25:00" }, "2030-01-07", [], now),
  );
  assert.throws(() =>
    slotsFor({ ...schedule, startTime: "12:00" }, "2030-01-07", [], now),
  );
});

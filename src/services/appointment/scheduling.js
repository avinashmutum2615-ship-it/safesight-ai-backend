export function dateOnly(value) {
  const date =
    typeof value === "string"
      ? value.slice(0, 10)
      : value instanceof Date
        ? value.toISOString().slice(0, 10)
        : "";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("A valid appointment date is required.");
  return date;
}
export function clinicToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function slotsFor(availability, date, booked = [], now = new Date()) {
  date = dateOnly(date);
  if (date < clinicToday(now)) return [];
  const minutes = (value) => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      throw new Error("Invalid schedule time.");
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };
  const {
    startTime,
    endTime,
    slotDuration,
    workingDays = [0, 1, 2, 3, 4, 5, 6],
    breaks = [],
    status,
  } = availability;
  if (!status || !workingDays.includes(new Date(date).getUTCDay())) return [];
  if (!Number.isInteger(slotDuration) || slotDuration < 5 || slotDuration > 240)
    throw new Error("Slot duration must be 5–240 minutes.");
  const start = minutes(startTime),
    end = minutes(endTime);
  if (start >= end) throw new Error("Schedule end must be after start.");
  for (const item of breaks) if (minutes(item.start) >= minutes(item.end)) throw new Error("Break end must be after start.");
  const result = [];
  for (let t = start; t + slotDuration <= end; t += slotDuration) {
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    if (new Date(`${date}T${time}:00+05:30`) <= now) continue;
    if (
      !booked.includes(time) &&
      !breaks.some(
        (b) => t < minutes(b.end) && t + slotDuration > minutes(b.start),
      )
    )
      result.push(time);
  }
  return result;
}

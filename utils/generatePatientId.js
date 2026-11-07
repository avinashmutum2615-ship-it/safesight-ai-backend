import { randomUUID } from "node:crypto";
export async function generatePatientId() {
  return `PAT-${randomUUID()}`;
}

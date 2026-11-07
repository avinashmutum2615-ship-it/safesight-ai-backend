import { randomUUID } from "node:crypto";
export default async function generateVisitId() {
  return `VIS-${randomUUID()}`;
}

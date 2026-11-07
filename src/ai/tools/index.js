import { searchPatientTool, createPatientTool } from "./patient/index.js";
import { searchDoctorTool, doctorTools } from "./doctor/index.js";
import { appointmentTools } from "./appointment/index.js";
import { knowledgeTools } from "./knowledge/index.js";
import { clinicTools } from "./clinic/index.js";
export const receptionistTools = [
  searchPatientTool,
  createPatientTool,
  searchDoctorTool,
  ...appointmentTools,
  ...knowledgeTools,
  ...clinicTools,
];
export const tools = [
  ...new Map(
    [...receptionistTools, ...doctorTools].map((t) => [t.name, t]),
  ).values(),
];

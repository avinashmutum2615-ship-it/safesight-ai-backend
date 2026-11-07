import { searchDoctorTool } from "../doctor/index.js";
import { getAvailableSlotsTool } from "../appointment/index.js";
import { knowledgeTools } from "../knowledge/index.js";
import { getClinicInfoTool } from "../clinic/index.js";
export const publicTools = [
  getClinicInfoTool,
  searchDoctorTool,
  getAvailableSlotsTool,
  ...knowledgeTools,
];

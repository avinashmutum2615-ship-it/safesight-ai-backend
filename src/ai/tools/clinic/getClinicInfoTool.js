import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getClinicInfo } from "../../../services/clinic/clinicService.js";

export const getClinicInfoTool = new DynamicStructuredTool({

    name: "get_clinic_info",

    description:
        `Use this tool whenever the user asks about:

- Clinic timings
- Consultation fees
- Address
- Contact
- Appointment link
- Services`,

    schema: z.object({

        topic: z.enum([
            "workingHours",
            "consultationFees",
            "services",
            "contact",
            "address",
            "appointmentUrl",
            "all"
        ])

    }),

    func: async ({ topic }) => {

        const result = await getClinicInfo(topic);

        if (!result) {
            return "Clinic information not found.";
        }

        return JSON.stringify(result);

    }

});
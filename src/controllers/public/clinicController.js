import { getClinicInfo } from "../../services/clinic/clinicService.js";

export async function getClinic(req, res) {
    try {
        const clinic = await getClinicInfo();

        res.status(200).json({
            success: true,
            clinic,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
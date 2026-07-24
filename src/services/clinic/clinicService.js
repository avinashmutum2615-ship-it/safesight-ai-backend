import ClinicSetting from "../../models/ClinicSetting.js";

export async function getClinicInfo(topic) {
    const clinic = await ClinicSetting.findOne();

    if (!clinic) {
        return null;
    }

    switch (topic) {
        case "workingHours":
            return clinic.workingHours;

        case "consultationFees":
            return clinic.consultationFees;

        case "services":
            return clinic.services;

        case "contact":
            return clinic.contact;

        case "address":
            return clinic.address;

        case "appointmentUrl":
            return clinic.appointmentUrl;

        default:
            return clinic;
    }
}
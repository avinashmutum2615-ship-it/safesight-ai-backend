import {
    createAppointmentService,
    getAvailableSlotsService,
} from "../../services/appointment/appointmentService.js";

export async function createPublicAppointment(req, res) {
    try {
        const appointment = await createAppointmentService(
            req.body,
            null
        );

        res.status(201).json({
            success: true,
            message: "Appointment booked successfully.",
            appointment,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

export async function getAvailableSlots(req, res) {
    try {
        const { doctor, date } = req.query;

        const slots = await getAvailableSlotsService(
            doctor,
            date
        );

        res.json({
            success: true,
            availableSlots: slots,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}
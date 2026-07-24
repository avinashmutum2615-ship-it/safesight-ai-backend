import {
    createAppointmentService,
    getAvailableSlotsService,
    rescheduleAppointmentService,
    cancelPublicAppointmentService,
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
        const { doctorId, date } = req.query;

        const slots = await getAvailableSlotsService(
            doctorId,
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

export const rescheduleAppointment = async (req, res) => {

    try {

        const appointment = await rescheduleAppointmentService(req.body);

        return res.status(200).json({
            success: true,
            message: "Appointment rescheduled successfully.",
            data: appointment,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const cancelPublicAppointment = async (req, res) => {

    try {

        const appointment =
            await cancelPublicAppointmentService(req.body);

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully.",
            data: appointment,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
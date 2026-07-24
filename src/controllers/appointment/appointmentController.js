import {
    createAppointmentService,
    getAllAppointmentsService,
    getAppointmentByIdService,
    updateAppointmentService,
    deleteAppointmentService,
    searchAppointmentsService,
    getAvailableSlotsService,
    getDashboardService
} from "../../services/appointment/appointmentService.js";


// Create Appointment
export const createAppointment = async (req, res) => {

    try {

        const appointment = await createAppointmentService(
            req.body,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: "Appointment created successfully.",
            appointment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// Get All Appointments
export const getAllAppointments = async (req, res) => {

    try {

        const appointments = await getAllAppointmentsService();

        res.json({
            success: true,
            appointments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


// Get Appointment By ID
export const getAppointmentById = async (req, res) => {

    try {

        const appointment = await getAppointmentByIdService(
            req.params.id
        );

        res.json({
            success: true,
            appointment
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// Update Appointment
export const updateAppointment = async (req, res) => {

    try {

        const appointment = await updateAppointmentService(
            req.params.id,
            req.body,
            req.user.id
        );

        res.json({
            success: true,
            message: "Appointment updated successfully.",
            appointment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

};


// Delete Appointment
export const deleteAppointment = async (req, res) => {

    try {

        await deleteAppointmentService(req.params.id);

        res.json({
            success: true,
            message: "Appointment deleted successfully."
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message
        });

    }

};


// Search Appointments
export const searchAppointments = async (req, res) => {

    try {

        const keyword = req.query.keyword || "";

        const appointments = await searchAppointmentsService(keyword);

        res.json({
            success: true,
            appointments
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

export const getAvailableSlots = async (req, res) => {

    try {

        const { doctorId, date } = req.query;

        const slots = await getAvailableSlotsService(
            doctorId,
            date
        );
        res.json({

            success: true,

            availableSlots: slots

        });

    } catch (error) {

        res.status(400).json({

            success: false,

            message: error.message

        });

    }

};

export const getDashboard = async (req, res, next) => {
    try {

        const dashboard = await getDashboardService();

        res.json({
            success: true,
            dashboard
        });

    } catch (error) {
        next(error);
    }
};
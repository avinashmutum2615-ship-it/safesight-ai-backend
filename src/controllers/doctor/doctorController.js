import {
    updateDoctorAvailabilityService,
    getAvailableDoctorsService,
    getDoctorByIdService,
    updateDoctorService,
    deleteDoctorService,
    searchDoctorsService,
} from "../../services/doctor/doctorService.js";

export async function updateAvailability(req, res) {

    try {

        const { status } = req.body;

        const doctor = await updateAvailabilityService(
            req.user.id,
            status
        );

        res.status(200).json({
            success: true,
            message: "Availability updated successfully.",
            availability: doctor.availability,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    } 

}

export async function getAvailableDoctors(req, res) {



    try {

        const doctors = await getAvailableDoctorsService();

        res.status(200).json({
            success: true,
            total: doctors.length,
            doctors,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}

export async function getDoctorById(req, res) {

    try {

        const doctor = await getDoctorByIdService(req.params.id);

        res.status(200).json({
            success: true,
            doctor,
        });

    } catch (error) {

        res.status(404).json({
            success: false,
            message: error.message,
        });

    }

}

export async function updateDoctor(req, res) {

    try {

        const doctor = await updateDoctorService(
            req.params.id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully.",
            doctor,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}
export async function deleteDoctor(req, res) {

    try {

        await deleteDoctorService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully.",
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}

export async function searchDoctors(req, res) {
    try {
        const keyword = req.query.keyword || "";

        const doctors = await searchDoctorsService(keyword);

        res.status(200).json({
            success: true,
            total: doctors.length,
            doctors,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
}
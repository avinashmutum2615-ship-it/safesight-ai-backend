const appointmentResponse = (appointment) => {

    return {

        id: appointment._id,

        patient: appointment.patient && {
            id: appointment.patient._id,
            patientId: appointment.patient.patientId,
            name: appointment.patient.name,
            phone: appointment.patient.phone
        },

        doctor: appointment.doctor && {
            id: appointment.doctor._id,
            name: appointment.doctor.userId?.name,
            specialization: appointment.doctor.specialization,
        },

        appointmentDate: appointment.appointmentDate,

        appointmentTime: appointment.appointmentTime,

        status: appointment.status,

        source: appointment.source,

        reason: appointment.reason,

        notes: appointment.notes,

        createdAt: appointment.createdAt,

        updatedAt: appointment.updatedAt

    };

};

export default appointmentResponse;
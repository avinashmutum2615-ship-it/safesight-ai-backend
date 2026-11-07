import Doctor from "../../models/Doctor.js";
import express from "express";

import { auth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/authorize.js";

import {
  getAvailableDoctors,
  updateAvailability,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  searchDoctors,
} from "../../controllers/doctor/doctorController.js";

const router = express.Router();
router.get("/availability",auth,authorize("doctor"),async(req,res)=>{
 const doctor=await Doctor.findOne({userId:req.user.id});
 if(!doctor)return res.status(404).json({success:false,message:"Doctor profile not found."});
 res.json({success:true,availability:doctor.availability});
});

router.patch("/availability", auth, authorize("doctor"), updateAvailability);

router.get("/search", searchDoctors);

router.get("/available", auth, getAvailableDoctors);

router.get("/:id", auth, authorize("admin"), getDoctorById);

router.patch("/:id", auth, authorize("admin"), updateDoctor);

router.delete("/:id", auth, authorize("admin"), deleteDoctor);

export default router;

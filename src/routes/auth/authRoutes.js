import express from "express";
import { auth } from "../../middleware/auth.js";
import { login } from "../../controllers/auth/authController.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", auth, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

export default router;

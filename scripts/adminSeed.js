import dotenv from "dotenv";
import { hashPassword } from "../utils/hashPassword.js";

import { connectDb } from "../src/config/database.js";
import User from "../src/models/User.js";

dotenv.config();

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)
  throw new Error("ADMIN_PASSWORD must have at least 12 characters.");
await connectDb();

try {
  const adminExists = await User.findOne({
    role: "admin",
  });

  if (adminExists) {
    console.log("Admin already exists.");
    process.exit(0);
  }

  const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD);

  const admin = await User.create({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    phone: process.env.ADMIN_PHONE,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created successfully.");

  process.exit(0);
} catch (error) {
  console.error(error);

  process.exit(1);
}

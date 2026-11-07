import User from "../../models/User.js";
import { comparePassword } from "../../../utils/hashPassword.js";
import { generateToken } from "../../../utils/generateToken.js";

export async function loginUser(email, password) {
  if (typeof email !== "string" || typeof password !== "string")
    throw new Error("Invalid email or password.");
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (!user.isActive) {
    throw new Error("Account is inactive.");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

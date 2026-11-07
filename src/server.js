import "./config/env.js";
import { connectDb } from "./config/database.js";
import app from "./app.js";
import mongoose from "mongoose";
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("Set JWT_SECRET to at least 32 random characters.");
await connectDb();
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const server = app.listen(process.env.PORT || 3000, () =>
  console.log("SafeSight is ready."),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );

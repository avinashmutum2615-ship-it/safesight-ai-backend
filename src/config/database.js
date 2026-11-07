import mongoose from "mongoose";
export async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri)
    throw new Error(
      "Set MONGODB_URI in .env (MongoDB Atlas or a local replica set).",
    );
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("MongoDB connected.");
}

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_MONGO_URI = "mongodb://localhost:27017/rag_db";
const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
if (!process.env.MONGO_URI) {
  console.warn(`MONGO_URI is not set; defaulting to ${DEFAULT_MONGO_URI}`);
}

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

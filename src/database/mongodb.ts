import mongoose from "mongoose";
import { CONSTANTS } from "../config/constant";

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(CONSTANTS.MONGO_URI);
  console.log("MongoDB connected");
};

// api/config/database.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connects to MongoDB Atlas using the connection string stored in the .env file.
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI as string;

    if (!mongoURI) {
      throw new Error("MONGO_URI missing or implemented incorrectly");
    }

    await mongoose.connect(mongoURI);
    console.log("Connection to BD succesful");
  } catch (error) {
    console.error("Error connecting to BD : ", error);
    process.exit(1);
  }
};

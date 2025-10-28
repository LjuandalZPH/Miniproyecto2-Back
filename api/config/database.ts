/**
 * @fileoverview Database connection utilities for the application.
 *
 * This module provides a single function to connect to a MongoDB Atlas
 * instance using Mongoose. It expects the connection URI to be provided via
 * the environment variable `MONGO_URI`. The module also ensures a clean
 * shutdown of the Mongoose connection on process termination (SIGINT).
 *
 * Module: api/config/database
 */

import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas using the `MONGO_URI` environment variable.
 *
 * Behavior and contract:
 * - Reads the connection URI from `process.env.MONGO_URI`.
 * - If `MONGO_URI` is not set, logs an error and exits the process with code 1.
 * - Attempts to connect with Mongoose and logs a success message on connect.
 * - On connection error, logs the error message and exits the process with code 1.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when the connection is successfully established.
 * @throws Will terminate the process with exit code 1 if the URI is missing or the connection fails.
 */
const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error("Error: MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB Atlas");
  } catch (error: any) {
    console.error("Error connecting to MongoDB Atlas:", error.message);
    process.exit(1);
  }
};

/**
 * Handle SIGINT (Ctrl+C) to close the Mongoose connection gracefully.
 *
 * This listener closes the active Mongoose connection and then exits the
 * process with code 0. It ensures resources are released when the
 * application is interrupted from the terminal.
 */
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to SIGINT");
  process.exit(0);
});

export default connectDB;
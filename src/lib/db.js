import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

export default connectDB;
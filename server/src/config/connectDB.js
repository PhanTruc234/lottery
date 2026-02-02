import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to Mongoose");
    } catch (error) {
        console.log("error", error)
    }
}
export default connectDB;
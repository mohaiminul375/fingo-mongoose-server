import mongoose from "mongoose";
// connect through mongoose
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log('MongoDB connection error', error);
        process.exit(1);
    }
}
export default connectDB;
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agrotech');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Backend will run with mock database status. Ensure local MongoDB is running to persist data.');
    // Do not crash the process; allow running offline with partial database functionality or mocks
  }
};

export default connectDB;

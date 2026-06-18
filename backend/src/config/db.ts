import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/data_analysis_agent';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DB WARNING] MongoDB Connection refused: ${error instanceof Error ? error.message : error}. Falling back to in-memory buffering.`);
  }
};

import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mychecklist';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] Successfully connected to MongoDB at ${mongoURI}`);
    return true;
  } catch (error: any) {
    console.warn(`[Database Warning] Could not connect to MongoDB (${mongoURI}): ${error.message}`);
    console.warn(`[Database Hint] Make sure MongoDB is running or update MONGODB_URI in .env file.`);
    return false;
  }
};

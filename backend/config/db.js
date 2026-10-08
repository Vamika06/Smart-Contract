import mongoose from 'mongoose';

const RETRY_DELAY_MS = 5000;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_contract_scanner';

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error(
      `   Tried to connect to: ${uri}\n` +
      '   -> If you intend to use LOCAL MongoDB, make sure the MongoDB server is actually installed and running\n' +
      '      (e.g. `mongod` or `brew services start mongodb-community` / `sudo systemctl start mongod`).\n' +
      '   -> If you intend to use MongoDB Atlas (cloud), set MONGODB_URI in backend/.env to your Atlas connection\n' +
      '      string instead (starts with mongodb+srv://...).\n' +
      `   Retrying in ${RETRY_DELAY_MS / 1000}s...`
    );
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Will attempt to reconnect...');
});

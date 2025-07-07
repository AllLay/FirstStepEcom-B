const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const itemRoutes = require('./routes/items');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const privateRoutes = require('./routes/private');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/items', itemRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/private', privateRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'BigAssData',
    });

    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`❌ Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

startServer();
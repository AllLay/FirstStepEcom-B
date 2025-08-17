const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const itemRoutes = require('./routes/items');
const authRoutes = require('./routes/auth');
const privateRoutes = require('./routes/private');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const whitelist = [
  'http://localhost:3000',
  'https://first-step-ecom.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/private', privateRoutes);
app.use("/api/cart", require("./routes/cart"));

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'BigAssData',
    });

    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

startServer();

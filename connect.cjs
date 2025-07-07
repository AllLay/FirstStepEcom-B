const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './config.env' });

let db;

const connectToDb = async () => {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    db = client.db();
    console.log(`Successfully connected to MongoDB: 
                                    ${process.env.DB_NAME}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectToDb first.");
  }
  return db;
};

if (require.main === module) {
  (async () => {
    try {
      console.log("Attempting to connect to MongoDB...");
      await connectToDb();
      console.log("Done.");
    } catch (err) {
      console.error("Exiting due to connection failure.");
      console.error(err)
      process.exit(1);
    }
  })();
}

module.exports = { connectToDb, getDb };
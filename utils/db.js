import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.database = database;

    this.client.connect().catch((err) => {
      console.error('Error connecting to MongoDB:', err.message);
    });
  }

  // Checks if the MongoDB connection is alive
  isAlive() {
    return this.client.isConnected();
  }

  // Returns the number of documents in the users collection
  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const count = await db.collection('users').countDocuments();
      return count;
    } catch (err) {
      console.error('Error getting user count:', err.message);
      return 0;
    }
  }

  // Returns the number of documents in the files collection
  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const count = await db.collection('files').countDocuments();
      return count;
    } catch (err) {
      console.error('Error getting file count:', err.message);
      return 0;
    }
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;

import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.db = null;
    this._connect();
  }

  async _connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.database);
      console.log('Connected to the database');
    } catch (error) {
      console.error('Failed to connect to the database:', error.message);
    }
  }

  async isAlive() {
    return !!this.db && this.client.topology.isConnected();
  }

  async nbUsers() {
    if (!(await this.isAlive())) return 0;

    const usersCollection = this.db.collection('users');
    return usersCollection.countDocuments({});
  }

  async nbFiles() {
    if (!(await this.isAlive())) return 0;

    const filesCollection = this.db.collection('files');
    return filesCollection.countDocuments({});
  }
}

const dbClient = new DBClient();

export default dbClient;

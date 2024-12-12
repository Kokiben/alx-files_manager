import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '27017';
        const database = process.env.DB_DATABASE || 'files_manager';
        const uri = `mongodb://${host}:${port}`;

        this.client = new MongoClient(uri, { useUnifiedTopology: true });
        this.dbName = database;
        this.client.connect().then(() => {
            this.db = this.client.db(this.dbName);
        }).catch((error) => {
            console.error('Failed to connect to MongoDB:', error);
        });
    }

    isAlive() {
        return this.client && this.client.topology && this.client.topology.isConnected();
    }

    async nbUsers() {
        try {
            if (!this.db) throw new Error('Database not initialized');
            const usersCollection = this.db.collection('users');
            return await usersCollection.countDocuments();
        } catch (error) {
            console.error('Error fetching user count:', error);
            return 0;
        }
    }

    async nbFiles() {
        try {
            if (!this.db) throw new Error('Database not initialized');
            const filesCollection = this.db.collection('files');
            return await filesCollection.countDocuments();
        } catch (error) {
            console.error('Error fetching file count:', error);
            return 0;
        }
    }
}

const dbClient = new DBClient();
export default dbClient;

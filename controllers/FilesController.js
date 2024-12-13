import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redisClient.js'; // Assuming a redis client is available for managing tokens

class FilesController {
  static async postUpload(req, res) {
    // Existing postUpload method
    // (Implementation from previous answer)
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { id } = req.params;  // File ID from URL parameter

    // Retrieve user based on the token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the file document based on ID
    const file = await FilesController.getFileById(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Return the file document
    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { parentId = 0, page = 0 } = req.query;  // Get parentId and page from query parameters

    // Retrieve user based on the token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate the pagination limits
    const skip = page * 20;  // Each page contains 20 items
    const limit = 20;

    try {
      // Fetch files for the specific user, with parentId filter and pagination
      const client = new MongoClient('mongodb://localhost:27017');
      await client.connect();
      const database = client.db('files_manager');
      const filesCollection = database.collection('files');

      const files = await filesCollection.aggregate([
        { $match: { userId: userId, parentId: parseInt(parentId) } },
        { $skip: skip },
        { $limit: limit },
        { $project: { name: 1, type: 1, parentId: 1, isPublic: 1, localPath: 1, userId: 1 } }
      ]).toArray();

      await client.close();

      return res.status(200).json(files);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Helper function to retrieve user ID from token
  static async getUserIdFromToken(token) {
    const userId = await redisClient.get(`auth_${token}`);
    return userId;
  }

  // Helper function to get a file by its ID
  static async getFileById(fileId) {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const database = client.db('files_manager');
    const filesCollection = database.collection('files');
    const file = await filesCollection.findOne({ _id: fileId });
    await client.close();
    return file;
  }

  // Helper function to create a file document in the DB
  static async createFile(fileDocument) {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const database = client.db('files_manager');
    const filesCollection = database.collection('files');
    const result = await filesCollection.insertOne(fileDocument);
    await client.close();
    return result.ops[0];
  }
}

export default FilesController;

import { MongoClient } from 'mongodb';
import redisClient from '../utils/redisClient.js'; // Assuming a redis client is available for managing tokens

class FilesController {
  // Existing method for uploading a file
  static async postUpload(req, res) {
    // (Implementation from previous answer)
  }

  // Existing method for showing a file
  static async getShow(req, res) {
    // (Implementation from previous answer)
  }

  // Existing method for listing files
  static async getIndex(req, res) {
    // (Implementation from previous answer)
  }

  // New method to handle publishing a file
  static async putPublish(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { id } = req.params;  // File ID from URL parameter

    // Retrieve the user based on the token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the file document based on ID
    const file = await FilesController.getFileById(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update the file to be public
    file.isPublic = true;

    // Save the updated file document
    const updatedFile = await FilesController.updateFile(file);

    // Return the updated file document
    return res.status(200).json(updatedFile);
  }

  // New method to handle unpublishing a file
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { id } = req.params;  // File ID from URL parameter

    // Retrieve the user based on the token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve the file document based on ID
    const file = await FilesController.getFileById(id);
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update the file to be private
    file.isPublic = false;

    // Save the updated file document
    const updatedFile = await FilesController.updateFile(file);

    // Return the updated file document
    return res.status(200).json(updatedFile);
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

  // Helper function to update a file document
  static async updateFile(file) {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const database = client.db('files_manager');
    const filesCollection = database.collection('files');
    await filesCollection.updateOne({ _id: file._id }, { $set: file });
    await client.close();
    return file;
  }
}

export default FilesController;

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redisClient.js'; // Assuming a redis client is available for managing tokens

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Retrieve user based on the token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate file parameters
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId if provided
    if (parentId !== 0) {
      const parentFile = await FilesController.getFileById(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Handle file/folder creation
    try {
      let fileDocument = { name, type, parentId, isPublic, userId };

      if (type === 'folder') {
        // Folder creation, no need to save data or local file
        const result = await FilesController.createFile(fileDocument);
        return res.status(201).json(result);
      } else {
        // File or Image creation
        const fileData = Buffer.from(data, 'base64');
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileUUID = uuidv4();
        const filePath = path.join(folderPath, fileUUID);

        // Ensure the folder exists
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Write the file to disk
        fs.writeFileSync(filePath, fileData);

        // Create the file document to store in DB
        fileDocument.localPath = filePath;
        const result = await FilesController.createFile(fileDocument);

        return res.status(201).json(result);
      }
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

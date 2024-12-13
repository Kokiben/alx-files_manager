import { MongoClient } from 'mongodb';
import redisClient from '../utils/redisClient.js'; // Assuming redis client is available for managing tokens
import Bull from 'bull';
import path from 'path';
import fs from 'fs';
import thumbnail from 'image-thumbnail';  // Assuming you installed image-thumbnail via npm

// Create a Bull queue for processing image thumbnails
const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379');  // Adjust Redis URL if needed

class FilesController {
  // POST /files - Handles file upload and enqueues image processing for thumbnails
  static async postUpload(req, res) {
    const token = req.headers['x-token'];  // Token from headers
    const { name, type, data } = req.body;  // Assuming image file data is sent in the body

    // Retrieve user based on token
    const userId = await FilesController.getUserIdFromToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Store the file in the DB (simplified, for example purposes)
    const file = { name, type, userId, isPublic: false, data, createdAt: new Date() };
    
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const database = client.db('files_manager');
    const filesCollection = database.collection('files');
    
    const result = await filesCollection.insertOne(file);
    await client.close();

    // Enqueue the job for processing the image
    if (type.startsWith('image/')) {
      fileQueue.add({
        fileId: result.insertedId,
        userId: userId,
      });
    }

    return res.status(201).json(file);
  }

  // Helper function to retrieve user ID from token
  static async getUserIdFromToken(token) {
    const userId = await redisClient.get(`auth_${token}`);
    return userId;
  }

  // GET /files/:id/data - Handles file retrieval and serves the correct thumbnail
  static async getShow(req, res) {
    const { id } = req.params;
    const { size } = req.query;  // Get the size query parameter
    
    // Validate size parameter
    if (size && ![500, 250, 100].includes(parseInt(size))) {
      return res.status(400).json({ error: 'Invalid size parameter' });
    }

    // Retrieve the file document
    const file = await FilesController.getFileById(id);
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if the requested size is valid and serve the appropriate thumbnail
    let filePath;
    if (size) {
      filePath = path.join(__dirname, 'uploads', `${file.name}_${size}`);
    } else {
      filePath = path.join(__dirname, 'uploads', file.name);
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Serve the file with the correct MIME-type
    res.sendFile(filePath);
  }

  // Helper function to retrieve a file by its ID
  static async getFileById(fileId) {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const database = client.db('files_manager');
    const filesCollection = database.collection('files');
    const file = await filesCollection.findOne({ _id: fileId });
    await client.close();
    return file;
  }
}

// Process the Bull queue for thumbnail generation
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the file document from the DB
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const database = client.db('files_manager');
  const filesCollection = database.collection('files');
  
  const file = await filesCollection.findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }

  // Generate 3 thumbnails with widths 500, 250, and 100
  const filePath = path.join(__dirname, 'uploads', file.name);  // Example file path
  
  try {
    const sizes = [500, 250, 100];
    
    for (let size of sizes) {
      const thumbnailPath = path.join(__dirname, 'uploads', `${file.name}_${size}`);
      
      // Generate the thumbnail
      const options = { width: size, height: size };
      const thumb = await thumbnail(filePath, options);

      // Store the thumbnail on disk
      fs.writeFileSync(thumbnailPath, thumb);
    }
  } catch (error) {
    throw new Error('Error generating thumbnails: ' + error.message);
  }

  await client.close();
});

export default FilesController;

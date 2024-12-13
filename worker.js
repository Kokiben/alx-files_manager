import Bull from 'bull';
import path from 'path';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import thumbnail from 'image-thumbnail';  // Install using npm install image-thumbnail

// Create a Bull queue for processing image thumbnails
const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379');

// Process the queue
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

console.log('Worker started and listening for jobs...');

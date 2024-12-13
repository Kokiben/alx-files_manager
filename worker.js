import Bull from 'bull';
import path from 'path';
import fs from 'fs';
import thumbnail from 'image-thumbnail';
import dbClient from './utils/db';

// Create the Bull queues
const userQueue = new Bull('userQueue');
const fileQueue = new Bull('fileQueue', 'redis://127.0.0.1:6379');

// Process the user queue
userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await dbClient.db.collection('users').findOne({ _id: userId });

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}!`);
  // In a real app, send an email via a third-party service like Mailgun or SendGrid here.
});

// Process the file queue
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retrieve the file document from the DB
  const file = await dbClient.db.collection('files').findOne({ _id: fileId, userId });
  if (!file) {
    throw new Error('File not found');
  }

  // Generate 3 thumbnails with widths 500, 250, and 100
  const filePath = path.join(__dirname, 'uploads', file.name); // Example file path

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
});

console.log('Worker started and listening for jobs...');

export { userQueue, fileQueue };

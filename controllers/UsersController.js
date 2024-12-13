import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
import { userQueue } from '../worker';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate that email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // MongoDB client initialization
    const client = new MongoClient('mongodb://localhost:27017');
    try {
      await client.connect();
      const database = client.db('files_manager');
      const usersCollection = database.collection('users');

      // Check if the user already exists
      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA-1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create the new user object
      const newUser = { email, password: hashedPassword };

      // Insert the new user into the database
      const result = await usersCollection.insertOne(newUser);

      // Add the job to the userQueue
      await userQueue.add({ userId: result.insertedId });

      // Return success response with user id and email
      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Close the MongoDB connection
      await client.close();
    }
  }
}

export default UsersController;

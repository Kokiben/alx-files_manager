import crypto from 'crypto';
import { MongoClient } from 'mongodb';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const client = new MongoClient('mongodb://localhost:27017');
    try {
      await client.connect();
      const database = client.db('files_manager');
      const usersCollection = database.collection('users');

      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = { email, password: hashedPassword };

      const result = await usersCollection.insertOne(newUser);
      return res.status(201).json({ id: result.insertedId, email });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.close();
    }
  }
}

export default UsersController;

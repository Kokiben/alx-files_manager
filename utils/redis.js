import redis from 'redis';

class RedisClient {
  constructor() {
    this.client = redis.createClient(); // Create a Redis client
    this.client.on('error', (err) => {
      console.error('Redis error: ', err);
    });
  }

  // Returns true if the connection is successful
  isAlive() {
    return this.client.connected;
  }

  // Asynchronously gets the value of a key from Redis
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  // Asynchronously sets a key-value pair in Redis with an expiration time in seconds
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  // Asynchronously deletes a key from Redis
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;

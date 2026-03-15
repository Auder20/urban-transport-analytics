const redis = require('../config/redis');

class CacheService {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async getOrFetch(key, fetchFn, ttl = 300) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return { data: cached, fromCache: true };
      }

      const data = await fetchFn();
      await this.set(key, data, ttl);
      return { data, fromCache: false };
    } catch (error) {
      console.error('Cache getOrFetch error:', error);
      throw error;
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Cache invalidatePattern error:', error);
      return 0;
    }
  }

  async delete(key) {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async publish(channel, message) {
    try {
      await redis.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Cache publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      const subscriber = redis.duplicate();
      await subscriber.subscribe(channel);
      subscriber.on('message', (chan, msg) => {
        if (chan === channel) {
          try {
            const data = JSON.parse(msg);
            callback(data);
          } catch (parseError) {
            console.error('Message parse error:', parseError);
          }
        }
      });
      return subscriber;
    } catch (error) {
      console.error('Cache subscribe error:', error);
      return null;
    }
  }
}

module.exports = new CacheService();

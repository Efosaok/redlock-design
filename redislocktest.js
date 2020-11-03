const redis = require('redis');
const redisLock = require('redislock');

const client = redis.createClient();

const lock = redisLock.createLock(client, {
  timeout: 60000,
  retries: 3,
  delay: 100,
});

const acquireLock = async (key, timeout) => {
  try {
    console.log('Acquiring Key', timeout);
    await lock.acquire(key);
    console.log('Acquired, trying to release', timeout);
    setTimeout(async () => {
      await lock.release(lock);
      console.log('Released successful', timeout);
    }, timeout);
  } catch (error) {
    console.log(error.message);
  }
};

acquireLock('123', 20000);
acquireLock('123', 50000);
acquireLock('123', 70000);
acquireLock('123', 10000);
acquireLock('123', 60000);

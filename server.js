const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const RedLock = require('redlock');

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const client = new Redis();

const redlock = new RedLock([client], {
  driftFactor: 0.01, // multiplied by lock ttl to determine drift time

  // the max number of times Redlock will attempt
  // to lock a resource before erroring
  retryCount: 0,

  // the time in ms between attempts
  retryDelay: 200, // time in ms

  // the max time in ms randomly added to retries
  // to improve performance under high contention
  // see https://www.awsarchitectureblog.com/2015/03/backoff.html
  retryJitter: 200, // time in ms
});

redlock.on('clientError', (err) => console.log(err));

app.get('/lock', async (req, res) => {
  try {
    const resource = `msisdn:${req.body.msisdn}`;
    const ttl = 2000000;
    const lock = await redlock.lock(resource, ttl);
    console.log(lock);
    res.status(200).json({ message: 'lock successfully acquired' });
    setTimeout(async () => {
      await lock.unlock();
      console.log('released');
    }, 7000);
  } catch (error) {
    if (error.name === 'LockError')
      return res.status(500).json({ message: 'entity is still locked' });
  }
});

// app.get('/release', async (req, res) => {
//   try {
//     const resource = `msisdn:${req.body.msisdn}`;
//     const ttl = 2000000;
//     const lock = await redlock.lock(resource, ttl);
//   } catch(error) {
//     if (error.name === 'LockError')
//     return res.status(500).json({ message: 'entity is still locked' });
// }
//   }
// })

// app.get('/acquired-locks', (req, res) => {
//   const locks = redisLock.getAcquiredLocks();

//   return res.status(200).json({ locks });
// });

// const isLocked = (acquiredLocks, key) =>
//   acquiredLocks.map(({ _key }) => _key).includes(key);

// app.get('/test-lock', (req, res) => {
//   const lockKey = `msisdn:${req.body.msisdn}`;

//   const keyIsLocked = isLocked(redisLock.getAcquiredLocks(), lockKey);

//   if (keyIsLocked)
//     return res.status(200).json({ message: 'System busy processing' });
//   return res.status(200).json({ message: 'You can continue' });
// });

// app.get('/release-lock', async (req, res) => {
//   const lockName = `msisdn:${req.body.msisdn}`;
//   // const newLock = redisLock.createLock(client, {
//   //   timeout: 60000,
//   //   retries: 3,
//   //   delay: 100,
//   // });
//   try {
//     await lock.acquire(lockName);
//     await lock.release();
//     return res
//       .status(200)
//       .json({ message: 'lock on this entity is currently open' });
//   } catch (error) {
//     if (error.name === 'LockAcquisitionError') {
//       lock.release();
//       return res.status(200).json({ message: 'lock successfully released' });
//     }
//   }
// });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

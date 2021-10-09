import cluster from 'cluster';
import http from 'http';
import faker from 'faker';
import { LruCache } from '../src';

const initCache = (): LruCache<string, string> => {
  const cache = new LruCache<string, string>();
  cache.init({
    max: 1000,
    maxAge: 86400,
    updateAgeOnGet: true,
    isWorker: cluster.isWorker,
    enabled: true,
  });
  return cache;
};

class VariativeLruCache extends LruCache<string, string> {}

const initCache2 = (): LruCache<string, string> => {
  const cache = new VariativeLruCache();
  cache.init({
    max: 1000,
    maxAge: 86400,
    updateAgeOnGet: true,
    isWorker: cluster.isWorker,
    enabled: true,
  });
  return cache;
};

if (cluster.isMaster) {
  cluster.fork();
  initCache();
  initCache2();
} else {
  const cache = initCache();
  const cache2 = initCache2();

  const server = http.createServer(async (req, res) => {
    const [has1, has2] = await Promise.all([cache.has(req.url), cache2.has(req.url)]);
    if (has1.ok && has1.unwrap() && has2.ok && has2.unwrap()) {
      const [phrase, phrase2] = await Promise.all([cache.get(req.url), cache2.get(req.url)]);
      res.end(phrase.unwrap() + '   ...   ' + phrase2.unwrap());
    } else {
      const phrase = faker.hacker.phrase();
      const phrase2 = faker.hacker.phrase();

      try {
        await Promise.all([cache.set(req.url, phrase), cache2.set(req.url, phrase2)]);
        res.end(phrase + '   ...   ' + phrase2);
      } catch (err) {
        console.error(err);
        res.statusCode = 500;
        res.end();
      }
    }
  });
  server.listen(8088, () => {
    console.log('server was started at port', 8088);
  });
}

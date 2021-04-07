import cluster from 'cluster';
import http from 'http';
import faker from 'faker';
import { LruCache } from '../src';

const initCache = (): LruCache<string, string> => {
  const cache = new LruCache<string, string>();
  cache.init({
    max: 1000,
    maxAge: 15000,
    updateAgeOnGet: true,
    isWorker: cluster.isWorker,
    enabled: true,
  });
  return cache;
};

if (cluster.isMaster) {
  cluster.fork();
  initCache();
} else {
  const cache = initCache();
  const server = http.createServer((req, res) => {
    cache.has(req.url).then((hasVal) => {
      if (hasVal.ok && hasVal.unwrap()) {
        cache.get(req.url).then((r) =>
          r
            .map((p) => res.end(p))
            .mapErr((err) => {
              console.error(err);
              res.statusCode = 500;
              res.end();
            }),
        );
      } else {
        const phrase = faker.hacker.phrase();
        cache.set(req.url, phrase).then((val) => {
          return val
            .map(() => res.end(phrase))
            .mapErr((err) => {
              console.error(err);
              res.statusCode = 500;
              res.end();
            });
        });
      }
    });
  });
  server.listen(8088, () => {
    console.log('server was started at port', 8088);
  });
}

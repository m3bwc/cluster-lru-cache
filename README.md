# Inmemory Nodejs Cluster LRU Cache

It's LRU based cache provider for the clustered and non-clustered systems.
We are dependent on the lru-cache package and provide flexible API to use in different cases.

This solution based on Node.JS IPC requests from the main thread to worker threads and its communications.

Everything is like everyone else, but it is simple to use, just look:

```
import cluster from 'cluster';
import { LruCache } from 'cluster-lru-cache';
import { cpus } from 'os';

const maxForks = cpus().length;

const LRU = (enabled: boolean) => new LruCache({
  enabled,
  max: 1000,
  maxAge: 86400 * 1000,
  updateOnGet: true,
});

const enabled = true;

if(cluster.isMaster) {
  for (let i = 0; i < maxForks; i++) {
    cluster.fork();
  }
  LRU(enabled);
} else {
  const cache = LRU(enabled);

  /**
    cache.hash({foo:'bar'});
    cache.get({foo:'bar'});
    cache.has({foo:'bar'});
    cache.set({foo:'bar'},{'bar':'foo'});
    cache.getByHash('somelonghashstring');
    cache.hasByHash('somelonghashstring');
    cache.setByHash('somelonghashstring',{'bar':'foo'});
    cache.setStatus(false) // cache disable
    cache.setStatus(true) // cache enable
    cache.reset();
  */
}

```


Also, we use the `ts-results` to our methods, which means:
* process chaining
* rxjs compatible operators
* no extra throw errors
* fptible
* easy to understand
* transparent flow
* etc

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LruCache } from '../src';
import { Err, Ok } from 'ts-results';
class LruCacheConsumer<P, V> extends LruCache<P, V> {}

describe('Lru cache', () => {
  it('should be defined', () => {
    const cache = new LruCacheConsumer();
    expect(cache).toBeDefined();
  });

  it('should has init function', () => {
    const cache = new LruCacheConsumer();
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    expect(cache.init).toBeDefined();
    cache.init({ enabled: true });
    expect(isMasterSpy).toHaveBeenCalledTimes(1);
  });

  it('should has hash function', () => {
    const cache = new LruCacheConsumer();
    const hash = cache.hash('somebigpayload');
    expect(hash).toBeDefined();
    expect(hash).toBeInstanceOf(Ok);
    expect(hash.ok).toBeTruthy();
    expect(hash.val).toHaveLength(40);
  });

  it('should has hashAsync function', async () => {
    const cache = new LruCacheConsumer();
    const hash = await cache.hashAsync('somebigpayload');
    expect(hash).toBeDefined();
    expect(hash).toBeInstanceOf(Ok);
    expect(hash.ok).toBeTruthy();
    expect(hash.val).toHaveLength(40);
  });

  it('should has hash function error', () => {
    const cache = new LruCacheConsumer();
    // @ts-ignore
    const hash = cache.hash();
    expect(hash).toBeDefined();
    expect(hash).toBeInstanceOf(Err);
    expect(hash.ok).toBeFalsy();
  });

  it('should has hashAsync function error', async () => {
    const cache = new LruCacheConsumer();
    // @ts-ignore
    const hash = await cache.hashAsync();
    expect(hash).toBeDefined();
    expect(hash).toBeInstanceOf(Err);
    expect(hash.ok).toBeFalsy();
  });

  it('should has setStatus function', () => {
    const cache = new LruCacheConsumer();
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.setStatus).toBeDefined();
    const status = cache.setStatus(false);
    expect(status).toBeInstanceOf(Ok);
    expect(status.val).toBeFalsy();
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(2);
  });

  it('should has reset function', () => {
    const cache = new LruCacheConsumer();
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.reset).toBeDefined();
    cache.reset();
    expect(isResponseSpy).toHaveBeenCalledTimes(0);
    expect(isMasterSpy).toHaveBeenCalledTimes(2);
  });

  it('should has has function', async () => {
    const payload = 'uniquestring';
    const cache = new LruCacheConsumer();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const result = await cache.has(payload);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(1);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Ok);
    expect(result.val).toBeFalsy();
  });

  it('should has get function', async () => {
    const payload = 'uniquestring';
    const cache = new LruCacheConsumer();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const result = await cache.get(payload);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(1);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Ok);
    expect(result.val).toBeFalsy();
  });

  it('should has set function', async () => {
    const payload = 'uniquestring';
    const value = 'find me if you can';
    const cache = new LruCacheConsumer();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const set = await cache.set(payload, value);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(1);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(set).toBeDefined();
    expect(set).toBeInstanceOf(Ok);
    expect(set.val).toBeTruthy();

    const exists = await cache.has(payload);
    expect(exists.val).toBeTruthy();
    const result = await cache.get(payload);
    expect(result.val).toBeDefined();
    expect(result.val).toEqual(value);
  });

  it('should has hasByHash function', async () => {
    const payload = 'uniquestring';
    const cache = new LruCacheConsumer();
    const hash = cache.hash(payload).unwrap();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const result = await cache.hasByHash(hash);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(0);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Ok);
    expect(result.val).toBeFalsy();
  });

  it('should has getByHash function', async () => {
    const payload = 'uniquestring';
    const cache = new LruCacheConsumer();
    const hash = cache.hash(payload).unwrap();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const result = await cache.getByHash(hash);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(0);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Ok);
    expect(result.val).toBeFalsy();
  });

  it('should has setByHash function', async () => {
    const payload = 'uniquestring';
    const value = 'find me if you can';
    const cache = new LruCacheConsumer();
    const hash = cache.hash(payload).unwrap();
    const hashSpy = jest.spyOn(cache as any, 'hash');
    const foldSpy = jest.spyOn(cache as any, 'fold');
    const isMasterSpy = jest.spyOn(cache as any, 'isMaster');
    const isResponseSpy = jest.spyOn(cache as any, 'response');
    cache.init({ enabled: true });
    expect(cache.has).toBeDefined();
    const set = await cache.setByHash(hash, value);
    expect(isResponseSpy).toHaveBeenCalledTimes(1);
    expect(isMasterSpy).toHaveBeenCalledTimes(3);
    expect(hashSpy).toHaveBeenCalledTimes(0);
    expect(foldSpy).toHaveBeenCalledTimes(1);
    expect(set).toBeDefined();
    expect(set).toBeInstanceOf(Ok);
    expect(set.val).toBeTruthy();

    const exists = await cache.hasByHash(hash);
    expect(exists.val).toBeTruthy();
    const result = await cache.getByHash(hash);
    expect(result.val).toBeDefined();
    expect(result.val).toEqual(value);
  });
});

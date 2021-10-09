import type LRU from 'lru-cache';

export interface LruCacheConfiguration<K, V> extends LRU.Options<K, V> {
  //** @deprecated */
  isWorker?: boolean;
  enabled: boolean;
  serviceName?: string;
}

export type Maybe<T> = T | undefined;
export type CacheEntity = { id: string };
export interface MessageResultValue<T> {
  value: Maybe<T>;
}

export enum LruCacheAction {
  GET = 'get',
  SET = 'set',
  HAS = 'has',
  GET_BY_HASH = 'get-by-hash',
  SET_BY_HASH = 'set-by-hash',
  HAS_BY_HASH = 'has-by-hash',
  SET_STATUS = 'set-status',
  RESET = 'reset',
}

export interface LruCacheMessageInterface<V, P> {
  readonly payload?: Maybe<P>;
  readonly value?: Maybe<V>;
  readonly hash?: Maybe<string>;
  readonly action: LruCacheAction;
}

export interface LruCacheMessageVariative {
  readonly serviceName: string;
}

export interface LruCacheMessageSign {
  readonly name: string;
}

export const LRU_CACHE_MESSAGE_NAME = 'LruCacheMessage';
export const LRU_CACHE_MESSAGE_RESULT_NAME = 'LruCacheMessageResult';

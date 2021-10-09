import {
  CacheEntity,
  LruCacheAction,
  LruCacheMessageInterface,
  LruCacheMessageSign,
  LruCacheMessageVariative,
  LRU_CACHE_MESSAGE_NAME,
  Maybe,
} from '../types';
import { nanoid } from 'nanoid';
import { Err, Ok, Result } from 'ts-results';

export class LruCacheMessage<V, P>
  implements LruCacheMessageInterface<V, P>, CacheEntity, LruCacheMessageSign {
  readonly payload: P;
  readonly value: V;
  readonly id: string;
  readonly action: LruCacheAction;
  readonly name: string;
  readonly hash: string;
  readonly serviceName: string;

  private constructor(opt: LruCacheMessageInterface<V, P> & LruCacheMessageVariative) {
    this.payload = opt.payload;
    this.value = opt.value;
    this.action = opt.action;
    this.hash = opt.hash;
    this.serviceName = opt.serviceName;
    this.id = nanoid();
    this.name = LRU_CACHE_MESSAGE_NAME;
  }

  public static of<VS, TS>(
    opt: LruCacheMessageInterface<VS, TS> & LruCacheMessageVariative,
  ): LruCacheMessage<VS, TS> {
    return new LruCacheMessage(opt);
  }

  public static isMessage(
    opt: Maybe<LruCacheMessage<unknown, unknown>>,
    serviceName: string,
  ): Result<void, Error> {
    return opt?.serviceName === serviceName && opt?.name === LRU_CACHE_MESSAGE_NAME
      ? Ok.EMPTY
      : Err(new Error('Is not an LruCacheMessage'));
  }

  public toJSON(): LruCacheMessageInterface<V, P> &
    CacheEntity &
    LruCacheMessageSign &
    LruCacheMessageVariative {
    return {
      payload: this.payload,
      value: this.value,
      hash: this.hash,
      action: this.action,
      id: this.id,
      name: this.name,
      serviceName: this.serviceName,
    };
  }
}

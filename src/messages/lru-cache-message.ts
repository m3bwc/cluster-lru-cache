import {
  CacheEntity,
  LruCacheAction,
  LruCacheMessageInterface,
  LruCacheMessageSign,
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

  private constructor(opt: LruCacheMessageInterface<V, P>) {
    this.payload = opt.payload;
    this.value = opt.value;
    this.action = opt.action;
    this.hash = opt.hash;
    this.id = nanoid();
    this.name = LRU_CACHE_MESSAGE_NAME;
  }

  public static of<VS, TS>(opt: LruCacheMessageInterface<VS, TS>): LruCacheMessage<VS, TS> {
    return new LruCacheMessage(opt);
  }

  public static isMessage(opt: Maybe<LruCacheMessage<unknown, unknown>>): Result<void, Error> {
    return opt?.name === LRU_CACHE_MESSAGE_NAME
      ? Ok.EMPTY
      : Err(new Error('Is not an LruCacheMessage'));
  }

  public toJSON(): LruCacheMessageInterface<V, P> & CacheEntity & LruCacheMessageSign {
    return {
      payload: this.payload,
      value: this.value,
      hash: this.hash,
      action: this.action,
      id: this.id,
      name: this.name,
    };
  }
}

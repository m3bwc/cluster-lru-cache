import { Err, Ok, Result } from 'ts-results';
import {
  CacheEntity,
  LruCacheMessageSign,
  LRU_CACHE_MESSAGE_RESULT_NAME,
  Maybe,
  MessageResultValue,
} from '../types';

export class LruCacheMessageResult<V> implements CacheEntity, MessageResultValue<V> {
  readonly id: string;
  readonly value: Maybe<V>;
  readonly name = LRU_CACHE_MESSAGE_RESULT_NAME;

  private constructor(id: string, value: V) {
    this.id = id;
    this.value = value;
  }
  public static of<VS>(id: string, value: VS): LruCacheMessageResult<VS> {
    return new LruCacheMessageResult<VS>(id, value);
  }

  public static isMessageResult(opt: Maybe<LruCacheMessageResult<unknown>>): Result<void, Error> {
    return opt?.name === LRU_CACHE_MESSAGE_RESULT_NAME
      ? Ok.EMPTY
      : Err(new Error('Is not an LruCacheMessage'));
  }

  public toJSON(): CacheEntity & MessageResultValue<V> & LruCacheMessageSign {
    return {
      id: this.id,
      value: this.value,
      name: this.name,
    };
  }
}

import { Err, Ok, Result } from 'ts-results';
import {
  CacheEntity,
  LruCacheMessageSign,
  LruCacheMessageVariative,
  LRU_CACHE_MESSAGE_RESULT_NAME,
  Maybe,
  MessageResultValue,
} from '../types';

export class LruCacheMessageResult<V> implements CacheEntity, MessageResultValue<V> {
  readonly id: string;
  readonly value: Maybe<V>;
  readonly name = LRU_CACHE_MESSAGE_RESULT_NAME;
  readonly serviceName: string;

  private constructor(id: string, serviceName: string, value: V) {
    this.id = id;
    this.value = value;
    this.serviceName = serviceName;
  }

  public static of<VS>(id: string, value: VS, serviceName: string): LruCacheMessageResult<VS> {
    return new LruCacheMessageResult<VS>(id, serviceName, value);
  }

  public static isMessageResult(
    opt: Maybe<LruCacheMessageResult<unknown>>,
    serviceName: string,
  ): Result<void, Error> {
    return opt?.serviceName === serviceName && opt?.name === LRU_CACHE_MESSAGE_RESULT_NAME
      ? Ok.EMPTY
      : Err(new Error('Is not an LruCacheMessage'));
  }

  public toJSON(): CacheEntity &
    MessageResultValue<V> &
    LruCacheMessageSign &
    LruCacheMessageVariative {
    return {
      id: this.id,
      value: this.value,
      name: this.name,
      serviceName: this.serviceName,
    };
  }
}

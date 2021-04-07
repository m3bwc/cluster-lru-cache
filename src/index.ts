import LRU from 'lru-cache';
import cluster from 'cluster';
import objecthash from 'object-hash';
import { Result, Ok, Err } from 'ts-results';
import { nanoid } from 'nanoid';
export interface LruCacheConfiguration<K, V> extends LRU.Options<K, V> {
  isWorker: boolean;
  enabled: boolean;
}

type Maybe<T> = T | undefined;
type CacheEntity = { id: string };
interface MessageResultValue<T> {
  value: Maybe<T>;
}

export enum LruCacheAction {
  GET = 'get',
  SET = 'set',
  HAS = 'has',
}

export interface LruCacheMessageInterface<V, P> {
  readonly payload?: Maybe<P>;
  readonly value?: Maybe<V>;
  readonly action: LruCacheAction;
}

export interface LruCacheMessageSign {
  name: string;
}

const LRU_CACHE_MESSAGE_NAME = 'LruCacheMessage';
const LRU_CACHE_MESSAGE_RESULT_NAME = 'LruCacheMessageResult';

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

  public toJSON(): CacheEntity & MessageResultValue<V> {
    return {
      id: this.id,
      value: this.value,
    };
  }
}

export class LruCacheMessage<V, P>
  implements LruCacheMessageInterface<V, P>, CacheEntity, LruCacheMessageSign {
  readonly payload: P;
  readonly value: V;
  readonly id: string;
  readonly action: LruCacheAction;
  readonly name: string;

  private constructor(opt: LruCacheMessageInterface<V, P>) {
    this.payload = opt.payload;
    this.value = opt.value;
    this.action = opt.action;
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
      action: this.action,
      id: this.id,
      name: this.name,
    };
  }
}

export class LruCache<P, V> {
  private cache: LRU<string, V>;
  private isWorker: boolean;
  private enabled: boolean;

  public init(config: LruCacheConfiguration<string, V>): void {
    this.enabled = config.enabled;
    this.isWorker = config.isWorker;
    this.cache = new LRU<string, V>(config);

    this.isMaster().andThen(() => {
      for (const id in cluster.workers) {
        cluster.workers[id].on('message', (msg: Maybe<LruCacheMessage<V, P>>) => {
          if (LruCacheMessage.isMessage(msg)) {
            switch (msg.action) {
              case LruCacheAction.GET: {
                return this.get(msg.payload, msg.id);
              }
              case LruCacheAction.HAS: {
                return this.has(msg.payload, msg.id);
              }
              case LruCacheAction.SET: {
                return this.set(msg.payload, msg.value, msg.id);
              }
            }
          }
        });
      }
      return Ok.EMPTY;
    });
  }

  private isEnabled(): Result<void, Error> {
    return this.enabled ? Ok.EMPTY : Err(new Error('LruCache is disabled'));
  }

  private isMaster(): Result<void, void> {
    return this.isWorker ? Err.EMPTY : Ok.EMPTY;
  }

  public hash(payload: unknown): Result<string, Error> {
    try {
      return Ok(objecthash(payload));
    } catch (e) {
      return Err(e);
    }
  }

  private response<V>(result: LruCacheMessageResult<V>): Result<LruCacheMessageResult<V>, Error> {
    try {
      for (const id in cluster.workers) {
        cluster.workers[id].send(result.toJSON());
      }
      return Ok(result);
    } catch (e) {
      return Err(e);
    }
  }

  private request<V, P>(message: LruCacheMessage<V, P>): Result<LruCacheMessage<V, P>, Error> {
    try {
      process.send(message.toJSON());
      return Ok(message);
    } catch (e) {
      console.error('requestHas', 'error', e);
      return Err(e);
    }
  }

  public async get(payload: P, id?: string): Promise<Result<Maybe<V>, Error>> {
    const isEnabled = this.isEnabled();
    if (isEnabled.ok) {
      const isMaster = this.isMaster();
      if (isMaster.ok) {
        if (!Boolean(id)) {
          return Err(new Error('Id is not provided'));
        }
        return this.hash(payload)
          .andThen((hash) => Ok(this.cache.get(hash)))
          .andThen((value) => this.response(LruCacheMessageResult.of<V>(id, value)))
          .andThen((response) => Ok(response.value));
      } else {
        return new Promise((resolve, reject) => {
          const messageSent = this.request(
            LruCacheMessage.of<never, P>({
              payload,
              action: LruCacheAction.GET,
            }),
          );
          if (messageSent.ok) {
            const message = messageSent.unwrap();
            const returnResponse = (msg: Maybe<LruCacheMessageResult<V>>): void => {
              if (msg?.id === message.id) {
                process.removeListener('message', returnResponse);
                resolve(Ok(msg.value));
              }
            };
            process.on('message', returnResponse);
          } else {
            reject(messageSent);
          }
        });
      }
    }
    return isEnabled as Result<V, Error>;
  }

  public async set(payload: P, value: V, id?: string): Promise<Result<boolean, Error>> {
    const isEnabled = this.isEnabled();
    if (isEnabled.ok) {
      const isMaster = this.isMaster();
      if (isMaster.ok) {
        if (!Boolean(id)) {
          return Err(new Error('Id is not provided'));
        }
        return this.hash(payload)
          .andThen((hash) => Ok(this.cache.set(hash, value)))
          .andThen((value) => this.response(LruCacheMessageResult.of<boolean>(id, value)))
          .andThen((response) => Ok(response.value));
      } else {
        return new Promise((resolve, reject) => {
          const messageSent = this.request(
            LruCacheMessage.of<V, P>({
              payload,
              value,
              action: LruCacheAction.SET,
            }),
          );
          if (messageSent.ok) {
            const message = messageSent.unwrap();
            const returnResponse = (msg: Maybe<LruCacheMessageResult<boolean>>): void => {
              if (msg?.id === message.id) {
                process.removeListener('message', returnResponse);
                resolve(Ok(msg.value));
              }
            };
            process.on('message', returnResponse);
          } else {
            reject(messageSent);
          }
        });
      }
    }
  }

  public async has(payload: P, id?: string): Promise<Result<boolean, Error>> {
    const isEnabled = this.isEnabled();
    if (isEnabled.ok) {
      const isMaster = this.isMaster();
      if (isMaster.ok) {
        if (!Boolean(id)) {
          return Err(new Error('Id is not provided'));
        }
        return this.hash(payload)
          .andThen((hash) => Ok(this.cache.has(hash)))
          .andThen((value) => this.response(LruCacheMessageResult.of<boolean>(id, value)))
          .andThen((response) => Ok(response.value));
      } else {
        return new Promise((resolve, reject) => {
          const messageSent = this.request(
            LruCacheMessage.of<never, P>({
              payload,
              action: LruCacheAction.HAS,
            }),
          );
          if (messageSent.ok) {
            const message = messageSent.unwrap();
            const returnResponse = (msg: Maybe<LruCacheMessageResult<boolean>>): void => {
              if (msg?.id === message.id) {
                process.removeListener('message', returnResponse);
                resolve(Ok(msg.value));
              }
            };
            process.on('message', returnResponse);
          } else {
            reject(messageSent);
          }
        });
      }
    }
  }
}

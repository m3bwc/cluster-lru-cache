import LRU from 'lru-cache';
import cluster from 'cluster';
import { Result, Ok, Err } from 'ts-results';
import { nanoid } from 'nanoid';
import hash from 'object-hash';

export interface LruCacheConfiguration<K, V> extends LRU.Options<K, V> {
  //** @deprecated */
  isWorker?: boolean;
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

export class LruCache<P, V> {
  private cache: LRU<string, V>;
  private isWorker: boolean;
  private _enabled: boolean;
  public get enabled(): boolean {
    return this._enabled;
  }

  public init(config: LruCacheConfiguration<string, V>): void {
    this._enabled = config.enabled;
    this.isWorker = cluster.isWorker;

    this.isMaster().andThen((isMaster) => {
      if (isMaster) {
        this.cache = new LRU<string, V>(config);

        for (const id in cluster.workers) {
          cluster.workers[id].on('message', (msg: Maybe<LruCacheMessage<V, P>>) => {
            setImmediate(() => {
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
                  case LruCacheAction.GET_BY_HASH: {
                    return this.getByHash(msg.hash, msg.id);
                  }
                  case LruCacheAction.HAS_BY_HASH: {
                    return this.hasByHash(msg.hash, msg.id);
                  }
                  case LruCacheAction.SET_BY_HASH: {
                    return this.setByHash(msg.hash, msg.value, msg.id);
                  }
                  case LruCacheAction.SET_STATUS: {
                    return this.setStatus(Boolean(msg.payload));
                  }
                  case LruCacheAction.RESET: {
                    return this.reset();
                  }
                }
              }
            });
          });
        }
      } else {
        process.on('message', (msg: Maybe<LruCacheMessage<V, P>>) => {
          setImmediate(() => {
            if (LruCacheMessage.isMessage(msg)) {
              switch (msg.action) {
                case LruCacheAction.SET_STATUS: {
                  this._enabled = Boolean(msg.payload);
                }
              }
            }
          });
        });
      }
      return Ok.EMPTY;
    });
  }

  protected isEnabled(): Result<boolean, Error> {
    return this.isMaster().andThen((isMaster) =>
      isMaster && !this.cache
        ? (Err(new Error(`${this.constructor.name} isn't initialized`)) as Result<boolean, Error>)
        : Ok(this.enabled),
    );
  }

  protected isMaster(): Result<boolean, Error> {
    if (typeof this.isWorker === 'undefined') {
      return Err(new Error('Undefined behaviour while checking isMaster or isWorker'));
    }
    return Ok(!this.isWorker);
  }

  public hash(payload: unknown): Result<string, Error> {
    try {
      return Ok(hash(payload));
    } catch (e) {
      return Err(e);
    }
  }

  public setStatus(payload: boolean): Result<boolean, Error> {
    return this.isMaster().andThen((isMaster) => {
      if (isMaster) {
        this._enabled = payload;
        return this.response(
          LruCacheMessage.of<never, boolean>({
            payload,
            action: LruCacheAction.SET_STATUS,
          }),
        ).map(() => payload);
      } else {
        return this.request(
          LruCacheMessage.of<never, boolean>({
            payload,
            action: LruCacheAction.SET_STATUS,
          }),
        ).map(() => payload);
      }
    });
  }

  public reset(): Result<void, Error> {
    return this.isMaster().map((isMaster) => {
      if (isMaster) {
        this.cache.reset();
      } else {
        this.request(
          LruCacheMessage.of<never, never>({
            action: LruCacheAction.RESET,
          }),
        ).map(() => Ok.EMPTY);
      }
    });
  }

  private response<RV>(
    result: LruCacheMessageResult<RV> | LruCacheMessage<never, RV>,
  ): Result<LruCacheMessageResult<RV> | LruCacheMessage<never, RV>, Error> {
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
      return Err(e);
    }
  }

  private async folder<FV>(
    message: LruCacheMessageInterface<V, P>,
    id?: string,
  ): Promise<Result<Maybe<FV>, Error>> {
    return this.isEnabled()
      .andThen(() => this.isMaster())
      .map((isMaster) => {
        if (isMaster) {
          return (message.hash ? Ok(message.hash) : this.hash(message.payload))
            .andThen((hash) => Ok(this.cache[message.action.substr(0, 3)](hash, message.value)))
            .andThen((value) => this.response(LruCacheMessageResult.of<FV>(id, value)))
            .map((response) => response.value);
        } else {
          return new Promise<Result<FV, Error>>((resolve, reject) => {
            this.request(LruCacheMessage.of<V, P>(message))
              .map((message) => {
                const returnResponse = (msg: Maybe<LruCacheMessageResult<FV>>): void => {
                  if (msg?.id === message.id) {
                    process.removeListener('message', returnResponse);
                    resolve(Ok(msg.value));
                  }
                };
                process.on('message', returnResponse);
              })
              .mapErr((error) => reject(Err(error)));
          });
        }
      })
      .unwrap();
  }

  public async get(payload: P, id?: string): Promise<Result<Maybe<V>, Error>> {
    return this.folder({ payload, action: LruCacheAction.GET }, id);
  }

  public async set(payload: P, value: V, id?: string): Promise<Result<boolean, Error>> {
    return this.folder<boolean>({ payload, value, action: LruCacheAction.SET }, id);
  }

  public async has(payload: P, id?: string): Promise<Result<boolean, Error>> {
    return this.folder<boolean>({ payload, action: LruCacheAction.HAS }, id);
  }

  public async getByHash(hash: string, id?: string): Promise<Result<Maybe<V>, Error>> {
    return this.folder({ hash, action: LruCacheAction.GET_BY_HASH }, id);
  }

  public async setByHash(hash: string, value: V, id?: string): Promise<Result<boolean, Error>> {
    return this.folder<boolean>({ hash, value, action: LruCacheAction.SET_BY_HASH }, id);
  }

  public async hasByHash(hash: string, id?: string): Promise<Result<boolean, Error>> {
    return this.folder<boolean>({ hash, action: LruCacheAction.HAS_BY_HASH }, id);
  }
}

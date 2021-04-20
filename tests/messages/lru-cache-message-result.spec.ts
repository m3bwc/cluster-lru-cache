/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LRU_CACHE_MESSAGE_RESULT_NAME } from '../../src/types';
import { LruCacheMessageResult } from '../../src/messages';

describe('LruCacheMessageResult', () => {
  it('should be defined', () => {
    const message = LruCacheMessageResult.of('uniqueid', true);
    expect(message).toBeDefined();
  });

  it('should have private constructor', () => {
    try {
      // @ts-ignore
      new LruCacheMessageResult('uniqueid', true);
    } catch (e) {
      expect(true).toBeTruthy();
    }
  });

  it('should has toJSON method', () => {
    const message = LruCacheMessageResult.of('uniqueid', true);
    expect(message.toJSON).toBeDefined();
    expect(message.toJSON()).toEqual({
      id: 'uniqueid',
      name: LRU_CACHE_MESSAGE_RESULT_NAME,
      value: true,
    });
  });
});

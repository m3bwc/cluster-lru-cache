/* eslint-disable @typescript-eslint/ban-ts-comment */
import { LruCacheMessage } from '../../src/messages';
import { LruCacheAction } from '../../src/types';

describe('LruCacheMessageResult', () => {
  it('should have private constructor', () => {
    try {
      // @ts-ignore
      new LruCacheMessage({
        action: LruCacheAction.GET,
        value: 'somevalue',
        payload: 'payload',
        hash: 'fasfnsdnfoenoi23n',
      });
    } catch (e) {
      expect(true).toBeTruthy();
    }
  });

  it('should be defined', () => {
    const message = LruCacheMessage.of({
      action: LruCacheAction.GET,
      serviceName: 'Test',
    });
    expect(message).toBeDefined();
  });

  it('should has toJSON method', () => {
    const test_obj = {
      action: LruCacheAction.GET,
      value: 'somevalue',
      payload: 'payload',
      hash: 'fasfnsdnfoenoi23n',
      serviceName: 'Test',
    };
    const message = LruCacheMessage.of(test_obj);
    expect(message.toJSON).toBeDefined();
    expect(message.toJSON()).toEqual({
      ...test_obj,
      id: message.id,
      name: message.name,
      serviceName: 'Test',
    });
  });

  it('should has isMessage method', () => {
    const test_obj = {
      action: LruCacheAction.GET,
      value: 'somevalue',
      payload: 'payload',
      serviceName: 'Test',
      hash: 'fasfnsdnfoenoi23n',
    };
    const message = LruCacheMessage.of(test_obj);
    expect(LruCacheMessage.isMessage).toBeDefined();
    expect(LruCacheMessage.isMessage(message, 'Test').ok).toBeTruthy();
    // @ts-ignore
    expect(LruCacheMessage.isMessage({ ...message, name: 'test' }).ok).toBeFalsy();
    // @ts-ignore
    expect(LruCacheMessage.isMessage().ok).toBeFalsy();
  });

  it('should have unique ids', () => {
    const test_obj = {
      action: LruCacheAction.GET,
      value: 'somevalue',
      payload: 'payload',
      hash: 'fasfnsdnfoenoi23n',
      serviceName: 'Test',
    };
    const message = LruCacheMessage.of(test_obj);
    const message2 = LruCacheMessage.of(test_obj);
    expect(message.id).not.toEqual(message2.id);
  });
});

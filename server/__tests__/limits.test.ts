import { describe, expect, it } from 'vitest';
import { TokenBucket, isRoomIdle } from '../limits';

describe('TokenBucket', () => {
  it('erlaubt Anfragen bis zur Kapazität und blockt dann', () => {
    const bucket = new TokenBucket(3, 1, 0);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(false); // Bucket leer
  });

  it('füllt mit der Zeit nach', () => {
    const bucket = new TokenBucket(2, 1, 0);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(false);
    // nach 1s ist 1 Token nachgefüllt
    expect(bucket.tryRemove(1000)).toBe(true);
    expect(bucket.tryRemove(1000)).toBe(false);
  });

  it('überschreitet die Kapazität beim Nachfüllen nicht', () => {
    const bucket = new TokenBucket(2, 1, 0);
    // lange Pause: höchstens 2 Tokens verfügbar
    expect(bucket.tryRemove(100_000)).toBe(true);
    expect(bucket.tryRemove(100_000)).toBe(true);
    expect(bucket.tryRemove(100_000)).toBe(false);
  });
});

describe('isRoomIdle', () => {
  const TTL = 1000;
  it('räumt nie auf, solange Verbindungen bestehen', () => {
    expect(isRoomIdle(0, true, 999_999, TTL)).toBe(false);
  });

  it('räumt verwaiste Räume nach Ablauf der TTL auf', () => {
    expect(isRoomIdle(0, false, TTL + 1, TTL)).toBe(true);
  });

  it('behält frische verwaiste Räume', () => {
    expect(isRoomIdle(0, false, TTL - 1, TTL)).toBe(false);
  });
});

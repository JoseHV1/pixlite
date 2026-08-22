import { HttpException } from '@nestjs/common';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  it('allows requests up to the limit, then throws 429', () => {
    const limiter = new RateLimiter(60_000, 3);

    limiter.enforce('1.1.1.1');
    limiter.enforce('1.1.1.1');
    limiter.enforce('1.1.1.1');

    expect(() => limiter.enforce('1.1.1.1')).toThrow(HttpException);
  });

  it('tracks separate keys independently', () => {
    const limiter = new RateLimiter(60_000, 1);

    limiter.enforce('a');
    expect(() => limiter.enforce('b')).not.toThrow();
    expect(() => limiter.enforce('a')).toThrow(HttpException);
  });

  it('lets a key back in once its oldest request falls out of the window', () => {
    jest.useFakeTimers();
    const limiter = new RateLimiter(1000, 1);

    limiter.enforce('1.1.1.1');
    expect(() => limiter.enforce('1.1.1.1')).toThrow(HttpException);

    jest.advanceTimersByTime(1001);
    expect(() => limiter.enforce('1.1.1.1')).not.toThrow();

    jest.useRealTimers();
  });

  it('sweeps out fully-expired keys periodically so the map does not grow unbounded', () => {
    jest.useFakeTimers();
    const limiter = new RateLimiter(1000, 5);

    limiter.enforce('stale-ip');
    jest.advanceTimersByTime(1001); // stale-ip's only timestamp is now expired

    for (let i = 0; i < 999; i++) {
      limiter.enforce(`filler-${i}`);
    }

    // The sweep runs on the 1000th call; stale-ip had nothing but expired
    // timestamps and should have been evicted, leaving only the 999 filler keys.
    expect(limiter.trackedKeyCount).toBe(999);

    jest.useRealTimers();
  });
});

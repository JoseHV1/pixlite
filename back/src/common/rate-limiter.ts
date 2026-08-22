import { HttpException, HttpStatus } from '@nestjs/common';

const SWEEP_EVERY_N_CALLS = 1000;

/**
 * Simple in-memory sliding-window rate limiter, keyed by whatever the caller
 * passes (usually the client IP). One instance per endpoint, not shared —
 * each controller that needs this constructs its own with its own window/limit.
 */
export class RateLimiter {
  private readonly requestTimestampsByKey = new Map<string, number[]>();
  private callsSinceSweep = 0;

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  /** Exposed for tests/monitoring — not used for rate-limiting decisions. */
  get trackedKeyCount(): number {
    return this.requestTimestampsByKey.size;
  }

  /** Throws HttpException(429) if the key is over budget; otherwise records this request. */
  enforce(key: string): void {
    const now = Date.now();
    const timestamps = (this.requestTimestampsByKey.get(key) ?? []).filter((t) => now - t < this.windowMs);

    if (timestamps.length >= this.maxRequests) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    timestamps.push(now);
    this.requestTimestampsByKey.set(key, timestamps);
    this.maybeSweep(now);
  }

  // A key that stops sending requests would otherwise linger in the map
  // forever (its stale array is only ever re-filtered when *that* key comes
  // back). Piggyback a full-map sweep on every Nth call instead of a timer,
  // so long-running deployments don't accumulate one entry per visitor IP
  // for the lifetime of the process.
  private maybeSweep(now: number): void {
    if (++this.callsSinceSweep < SWEEP_EVERY_N_CALLS) return;
    this.callsSinceSweep = 0;

    for (const [key, timestamps] of this.requestTimestampsByKey) {
      if (timestamps.every((t) => now - t >= this.windowMs)) {
        this.requestTimestampsByKey.delete(key);
      }
    }
  }
}

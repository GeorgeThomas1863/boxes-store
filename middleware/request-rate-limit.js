const TOO_MANY_MESSAGE = "Too many requests. Please try again later.";
const MAX_TRACKED_IPS = 10000;

export const createRequestRateLimit = ({ max, windowMs }) => {
  const hits = new Map();

  // A record is only ever added fresh (never moved), so Map order is oldest window first
  // and pruning can stop at the first record still inside its window
  const pruneExpired = (now) => {
    for (const [ip, record] of hits) {
      if (now - record.windowStart <= windowMs) return;
      hits.delete(ip);
    }
  };

  const evictOldestIfFull = () => {
    if (hits.size < MAX_TRACKED_IPS) return;
    const oldestIp = hits.keys().next().value;
    hits.delete(oldestIp);
    console.log(`RATE LIMIT FULL (${MAX_TRACKED_IPS} IPs) — evicted oldest IP ${oldestIp}`);
  };

  return (req, res, next) => {
    const now = Date.now();
    pruneExpired(now);

    const record = hits.get(req.ip);
    if (!record) {
      evictOldestIfFull();
      hits.set(req.ip, { count: 1, windowStart: now });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({ success: false, message: TOO_MANY_MESSAGE });
    }

    record.count += 1;
    next();
  };
};

export const contactRateLimit = createRequestRateLimit({ max: 5, windowMs: 60 * 60 * 1000 });
export const shippingRateLimit = createRequestRateLimit({ max: 30, windowMs: 15 * 60 * 1000 });
export const paymentIntentRateLimit = createRequestRateLimit({ max: 20, windowMs: 15 * 60 * 1000 });

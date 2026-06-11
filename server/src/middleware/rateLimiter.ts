import type { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum requests per window
  message: string;
  skip?: (req: Request) => boolean; // Function to skip rate limiting for certain requests
}

// Default rate limit configurations
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
};

const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit login attempts to 5 per hour
  message: 'Too many login attempts. Please try again in an hour.'
};

const API_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit API calls to 60 per minute
  message: 'API rate limit exceeded. Please try again later.'
};

// In-memory store for rate limiting (for simplicity, use redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

function getClientIp(req: Request): string {
  // Check for forwarded IP from proxy
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') {
    return xRealIp;
  }
  
  // Fall back to connection remote address
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req: Request, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${ip}:${req.path}`;
  
  // Skip if configured
  if (config.skip && config.skip(req)) {
    return { allowed: true, remaining: config.max, resetTime: now + config.windowMs };
  }
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetTime: now + config.windowMs };
  }
  
  // Existing window
  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetTime: entry.resetTime };
}

export function rateLimiter(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = checkRateLimit(req, config);
    
    if (!result.allowed) {
      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      });
      return res.status(429).json({ 
        success: false, 
        error: config.message,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    });
    
    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = rateLimiter(AUTH_RATE_LIMIT);
export const apiRateLimiter = rateLimiter(API_RATE_LIMIT);
export const generalRateLimiter = rateLimiter(DEFAULT_RATE_LIMIT);

// Middleware to skip rate limiting for authenticated users
export function conditionalRateLimiter(config: RateLimitConfig = API_RATE_LIMIT) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for authenticated requests
    if (req.headers.authorization) {
      return next();
    }
    
    const limiter = rateLimiter(config);
    return limiter(req, res, next);
  };
}
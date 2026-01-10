// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis or Upstash Rate Limit

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max number of unique tokens per interval
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private cache: Map<string, RateLimitEntry> = new Map()
  private interval: number
  private maxRequests: number

  constructor(config: RateLimitConfig) {
    this.interval = config.interval
    this.maxRequests = config.uniqueTokenPerInterval
  }

  check(identifier: string): { success: boolean; remaining: number; reset: number } {
    const now = Date.now()
    const entry = this.cache.get(identifier)

    // Clean up old entries periodically
    if (this.cache.size > 10000) {
      this.cleanup(now)
    }

    if (!entry || now > entry.resetTime) {
      // Create new entry
      const resetTime = now + this.interval
      this.cache.set(identifier, { count: 1, resetTime })
      return {
        success: true,
        remaining: this.maxRequests - 1,
        reset: resetTime,
      }
    }

    // Update existing entry
    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetTime,
      }
    }

    entry.count++
    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      reset: entry.resetTime,
    }
  }

  private cleanup(now: number) {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.resetTime) {
        this.cache.delete(key)
      }
    }
  }
}

// Rate limit configurations for different endpoint types
const rateLimiters = {
  // Upload endpoints - 10 requests per 10 minutes per user
  upload: new RateLimiter({
    interval: 10 * 60 * 1000, // 10 minutes
    uniqueTokenPerInterval: 10,
  }),

  // AI endpoints - 20 requests per hour per user (expensive operations)
  ai: new RateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 20,
  }),

  // Voice endpoints - 30 requests per hour per user
  voice: new RateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 30,
  }),

  // General API - 100 requests per 15 minutes per IP
  general: new RateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 100,
  }),
}

export type RateLimitType = keyof typeof rateLimiters

/**
 * Check rate limit for a given identifier and endpoint type
 * @param identifier - User ID or IP address
 * @param type - Type of rate limit to apply
 * @returns Object with success status and rate limit info
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): { success: boolean; remaining: number; reset: number } {
  return rateLimiters[type].check(identifier)
}

/**
 * Get client identifier from request (user ID or IP)
 * @param userId - Authenticated user ID (preferred)
 * @param request - Next.js request object
 * @returns Identifier string for rate limiting
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown'

  return `ip:${ip}`
}

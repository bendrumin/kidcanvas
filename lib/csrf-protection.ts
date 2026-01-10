// CSRF Protection using Origin header verification
// For Next.js API routes

/**
 * Verify CSRF protection for state-changing requests (POST, PUT, DELETE, PATCH)
 * Checks that the Origin header matches the allowed origins
 *
 * @param request - The Next.js request object
 * @returns Object with success status and error message
 */
export function verifyCsrfProtection(request: Request): {
  success: boolean
  error?: string
} {
  const method = request.method

  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { success: true }
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Get allowed origins from environment or use defaults
  const allowedOrigins = getAllowedOrigins()

  // Check Origin header (preferred)
  if (origin) {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      return { success: true }
    }
    return {
      success: false,
      error: 'Invalid origin - potential CSRF attack',
    }
  }

  // Fallback to Referer header (less reliable)
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`

      if (isAllowedOrigin(refererOrigin, allowedOrigins)) {
        return { success: true }
      }
    } catch {
      // Invalid referer URL
    }
    return {
      success: false,
      error: 'Invalid referer - potential CSRF attack',
    }
  }

  // No Origin or Referer header - likely not a browser request
  // Could be Postman, curl, or a legitimate mobile app
  // For additional security, you could require a custom header
  console.warn('CSRF: No Origin or Referer header present')

  // For API routes that should ONLY be called from the browser, return false here
  // For now, we'll allow it but log a warning
  return { success: true }
}

/**
 * Get list of allowed origins for CSRF protection
 */
function getAllowedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ]

  return origins.filter((origin): origin is string => !!origin)
}

/**
 * Check if an origin is in the allowed list
 */
function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  // Remove trailing slash for comparison
  const normalizedOrigin = origin.replace(/\/$/, '')

  return allowedOrigins.some(allowed => {
    const normalizedAllowed = allowed.replace(/\/$/, '')
    return normalizedOrigin === normalizedAllowed
  })
}

// Input validation and sanitization utilities
// Uses Zod for schema validation

import { z } from 'zod'

// ============================================
// SANITIZATION UTILITIES
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Sanitize text input - allows basic formatting but prevents XSS
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUuid(input: string): string | null {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(input)) {
    return null
  }
  return input.toLowerCase()
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/\.{2,}/g, '_') // Remove .. sequences
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// User ID validation
export const userIdSchema = z.string().uuid('Invalid user ID format')

// Family ID validation
export const familyIdSchema = z.string().uuid('Invalid family ID format')

// Child ID validation
export const childIdSchema = z.string().uuid('Invalid child ID format')

// Artwork ID validation
export const artworkIdSchema = z.string().uuid('Invalid artwork ID format')

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')

// Story validation
export const storySchema = z
  .string()
  .min(20, 'Story must be at least 20 characters')
  .max(10000, 'Story too long (max 10,000 characters)')
  .transform(sanitizeText)

// Title validation
export const titleSchema = z
  .string()
  .min(1, 'Title is required')
  .max(200, 'Title too long (max 200 characters)')
  .transform(sanitizeText)
  .optional()

// Description validation
export const descriptionSchema = z
  .string()
  .max(2000, 'Description too long (max 2,000 characters)')
  .transform(sanitizeText)
  .optional()

// Tags validation
export const tagsSchema = z
  .array(z.string().max(50, 'Tag too long').transform(sanitizeText))
  .max(20, 'Too many tags (max 20)')
  .optional()

// Date validation
export const dateSchema = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date format'
  )

// Voice duration validation
export const voiceDurationSchema = z
  .number()
  .int('Duration must be an integer')
  .min(0, 'Duration cannot be negative')
  .max(180, 'Voice note too long (max 3 minutes)')

// Plan ID validation
export const planIdSchema = z.enum(['free', 'family', 'pro'], {
  message: 'Invalid plan ID',
})

// ============================================
// COMPOSITE VALIDATION SCHEMAS
// ============================================

// Artwork upload validation
export const artworkUploadSchema = z.object({
  familyId: familyIdSchema,
  childId: childIdSchema,
  userId: userIdSchema,
  title: titleSchema,
  story: storySchema,
  description: descriptionSchema,
  tags: tagsSchema,
  createdDate: dateSchema,
})

// Voice upload validation
export const voiceUploadSchema = z.object({
  artworkId: artworkIdSchema,
  familyId: familyIdSchema,
  userId: userIdSchema,
  duration: voiceDurationSchema,
})

// AI tagging validation
export const aiTaggingSchema = z.object({
  artworkId: artworkIdSchema,
  imageUrl: z.string().url('Invalid image URL'),
})

// Admin delete user validation
export const adminDeleteUserSchema = z.object({
  userId: userIdSchema,
})

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and sanitize form data
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and sanitized data or error
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }
    return {
      success: false,
      error: 'Validation failed',
    }
  }
}

/**
 * Validate URL is from allowed domain
 */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedDomains = [
      'r2.cloudflarestorage.com',
      'r2.dev',
    ]

    return allowedDomains.some(domain =>
      parsed.hostname.endsWith(domain)
    )
  } catch {
    return false
  }
}

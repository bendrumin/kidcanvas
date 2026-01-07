import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function calculateAge(birthDate: Date | string, artworkDate: Date | string): string {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const artwork = typeof artworkDate === 'string' ? new Date(artworkDate) : artworkDate
  
  const months = (artwork.getFullYear() - birth.getFullYear()) * 12 + 
                 (artwork.getMonth() - birth.getMonth())
  
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} old`
  }
  
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''} old`
  }
  
  return `${years}y ${remainingMonths}m old`
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const ROLE_PERMISSIONS = {
  owner: {
    viewGallery: true,
    addArtwork: true,
    deleteArtwork: true,
    manageChildren: true,
    inviteMembers: true,
    removeMembers: true,
    manageBilling: true,
  },
  parent: {
    viewGallery: true,
    addArtwork: true,
    deleteArtwork: true,
    manageChildren: true,
    inviteMembers: true,
    removeMembers: true, // Cannot remove other parents or owner
    manageBilling: false,
  },
  member: {
    viewGallery: true,
    addArtwork: true,
    deleteArtwork: false,
    manageChildren: false,
    inviteMembers: false,
    removeMembers: false,
    manageBilling: false,
  },
  viewer: {
    viewGallery: true,
    addArtwork: false,
    deleteArtwork: false,
    manageChildren: false,
    inviteMembers: false,
    removeMembers: false,
    manageBilling: false,
  },
} as const

export type Role = keyof typeof ROLE_PERMISSIONS

export function hasPermission(role: Role, permission: keyof typeof ROLE_PERMISSIONS.owner): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}


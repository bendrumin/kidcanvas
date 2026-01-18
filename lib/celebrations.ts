/**
 * Celebration utilities for success actions
 * Shared confetti and celebration effects across the app
 */

import confetti from 'canvas-confetti'

/**
 * Fire confetti celebration with brand colors
 * Perfect for uploads, favorites, and other success moments!
 */
export function celebrate(options?: {
  intensity?: 'subtle' | 'normal' | 'intense'
  colors?: string[]
}) {
  const { intensity = 'normal', colors } = options || {}
  
  const count = intensity === 'subtle' ? 100 : intensity === 'intense' ? 300 : 200
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: opts.colors || colors || ['#E91E63', '#9B59B6', '#3498DB', '#F39C12', '#2ECC71'],
    })
  }

  // Subtle celebration (for frequent actions like favorites)
  if (intensity === 'subtle') {
    fire(0.3, { spread: 40, startVelocity: 30, colors: ['#E91E63', '#9B59B6'] })
    fire(0.2, { spread: 60, startVelocity: 20, colors: ['#3498DB', '#2ECC71'] })
    return
  }

  // Normal celebration (uploads, major actions)
  fire(0.25, { spread: 26, startVelocity: 55 })
  fire(0.2, { spread: 60 })
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
  fire(0.1, { spread: 120, startVelocity: 45 })

  // Intense celebration (milestones, special achievements)
  if (intensity === 'intense') {
    setTimeout(() => {
      fire(0.3, { spread: 70, startVelocity: 60 })
      fire(0.2, { spread: 80, startVelocity: 40 })
    }, 200)
  }
}

/**
 * Subtle celebration for frequent actions (favorites, small updates)
 */
export function celebrateSubtle() {
  celebrate({ intensity: 'subtle' })
}

/**
 * Normal celebration for standard success actions (uploads, saves)
 */
export function celebrateNormal() {
  celebrate({ intensity: 'normal' })
}

/**
 * Intense celebration for special moments (milestones, achievements)
 */
export function celebrateIntense() {
  celebrate({ intensity: 'intense' })
}

'use client'

import React, { useState, useEffect } from 'react'

interface ArtworkScribbleProps {
  variant?: 'flower' | 'rocket' | 'rocketship' | 'dinosaur' | 'rainbow' | 'camera' | 'palette' | 'phone' | 'family' | 'grandma' | 'multi-kid' | 'default'
  className?: string
  size?: number
}

// Predefined scribble paths that look like kid artwork (wobbly, imperfect)
const scribblePaths: Record<string, string[]> = {
  flower: [
    'M 20 40 Q 28 22, 38 28 Q 30 18, 20 10 Q 12 18, 20 28 Q 10 20, 20 40',
    'M 28 18 C 33 13, 43 13, 48 18 C 45 23, 35 23, 28 18',
    'M 20 30 Q 20 38, 20 50',
    'M 15 50 Q 18 46, 23 50',
    'M 23 50 Q 20 54, 15 50',
  ],
  rocket: [
    'M 28 50 Q 28 20, 30 20 Q 38 20, 40 20 Q 40 50, 28 50',
    'M 25 20 Q 28 16, 32 20',
    'M 33 20 Q 38 16, 42 20',
    'M 28 50 Q 24 58, 28 54 Q 32 58, 36 54 Q 40 58, 42 50',
  ],
  dinosaur: [
    'M 20 50 Q 24 28, 34 32 Q 38 22, 48 28 Q 52 34, 50 50 Q 46 58, 36 54 Q 26 58, 20 50',
    'M 24 34 C 20 28, 16 28, 20 34',
    'M 44 34 C 48 28, 52 28, 48 34',
    'M 30 50 Q 30 58, 30 65',
    'M 40 50 Q 40 58, 40 65',
  ],
  rainbow: [
    'M 10 40 Q 32 22, 58 40',
    'M 12 42 Q 32 24, 56 42',
    'M 14 44 Q 32 26, 54 44',
    'M 16 46 Q 32 28, 52 46',
  ],
  camera: [
    'M 20 30 Q 20 20, 20 20 Q 38 20, 40 20 Q 40 30, 40 30 Q 40 20, 20 30',
    'M 25 25 C 27 22, 31 22, 33 25 C 31 27, 27 27, 25 25',
    'M 30 30 Q 30 35, 30 40',
  ],
  palette: [
    'M 25 20 Q 33 15, 43 20 Q 48 28, 45 38 Q 35 43, 25 38 Q 20 30, 25 20',
    'M 28 24 C 30 22, 33 22, 35 24',
    'M 31 30 C 33 28, 36 28, 38 30',
    'M 28 34 C 30 32, 33 32, 35 34',
  ],
  phone: [
    'M 25 15 Q 25 15, 33 15 Q 35 15, 35 15 Q 35 43, 35 45 Q 33 45, 25 45 Q 25 45, 25 15',
    'M 28 20 Q 30 20, 32 20',
    'M 28 40 Q 30 40, 32 40',
  ],
  family: [
    'M 30 20 C 30 15, 33 15, 35 18 C 35 22, 32 24, 30 20',
    'M 30 24 Q 30 32, 30 40',
    'M 25 40 Q 28 40, 35 40',
    'M 20 45 Q 25 45, 40 45',
  ],
  grandma: [
    'M 30 20 C 30 15, 33 15, 35 18 C 35 22, 32 24, 30 20',
    'M 30 24 Q 30 32, 30 40',
    'M 25 40 Q 28 40, 35 40',
    'M 28 22 Q 30 20, 32 22',
  ],
  'multi-kid': [
    'M 20 20 C 20 15, 23 15, 25 18 C 25 22, 22 24, 20 20',
    'M 20 24 Q 20 32, 20 40',
    'M 35 20 C 35 15, 38 15, 40 18 C 40 22, 37 24, 35 20',
    'M 35 24 Q 35 32, 35 40',
    'M 15 40 Q 20 40, 45 40',
  ],
  default: [
    'M 20 30 Q 28 22, 38 30 Q 30 38, 20 30',
    'M 24 26 Q 28 22, 34 26',
    'M 24 34 Q 28 38, 34 34',
  ],
}

const colors = [
  '#E91E63', // pink
  '#9B59B6', // purple
  '#3498DB', // blue
  '#2ECC71', // green
  '#F39C12', // orange
  '#E74C3C', // red
  '#1ABC9C', // teal
  '#F1C40F', // yellow
]

export function ArtworkScribble({ variant = 'default', className = '', size = 60 }: ArtworkScribbleProps) {
  // Normalize variant name (rocketship -> rocket for file lookup, but also check rocketship.svg)
  const fileVariant = variant === 'rocketship' ? 'rocket' : variant
  const svgPaths = variant === 'rocketship' 
    ? [`/artwork-scribbles/rocketship.svg`, `/artwork-scribbles/rocket.svg`] // Try both
    : [`/artwork-scribbles/${fileVariant}.svg`]
  const [useSvgFile, setUseSvgFile] = useState(false)
  const [svgContent, setSvgContent] = useState<string | null>(null)
  
  // Try to load SVG file from public directory (try multiple paths for rocketship)
  useEffect(() => {
    let cancelled = false
    
    // Try each path until one works
    const tryLoadSvg = async (paths: string[]) => {
      for (const path of paths) {
        try {
          const res = await fetch(path)
          if (res.ok) {
            const content = await res.text()
            if (!cancelled && content && content.trim().length > 0) {
              setSvgContent(content)
              setUseSvgFile(true)
              return
            }
          }
        } catch (error) {
          // Try next path
          if (process.env.NODE_ENV === 'development') {
            console.debug(`Failed to load SVG from ${path}:`, error)
          }
          continue
        }
      }
      // If none worked, use programmatic paths
      if (!cancelled) {
        setUseSvgFile(false)
        setSvgContent(null)
      }
    }
    
    // Reset state before trying to load
    setUseSvgFile(false)
    setSvgContent(null)
    tryLoadSvg(svgPaths)
    
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]) // Re-run when variant changes
  
  // If SVG file exists, render it
  if (useSvgFile && svgContent) {
    // Extract viewBox from SVG to maintain aspect ratio
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 400 300'
    
    // Parse viewBox to calculate aspect ratio
    const viewBoxValues = viewBox.split(/\s+/).map(Number).filter(n => !isNaN(n))
    const viewBoxWidth = viewBoxValues[2] || 400
    const viewBoxHeight = viewBoxValues[3] || 300
    const aspectRatio = viewBoxWidth / viewBoxHeight
    
    // Calculate height based on width and aspect ratio
    const calculatedHeight = size / aspectRatio
    
    // Extract inner content (everything between <svg> tags)
    const innerMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
    const innerContent = innerMatch ? innerMatch[1] : svgContent
    
    // If we couldn't extract inner content, try to modify the SVG directly
    if (!innerContent || innerContent.trim() === '') {
      // Fallback: modify the SVG string to adjust width/height
      const modifiedSvg = svgContent
        .replace(/width=["'][^"']*["']/i, `width="${size}"`)
        .replace(/height=["'][^"']*["']/i, `height="${calculatedHeight}"`)
        .replace(/style=["'][^"']*["']/i, `style="width: ${size}px; height: ${calculatedHeight}px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));"`)
      
      return (
        <div
          className={className}
          style={{
            width: size,
            height: calculatedHeight,
            maxWidth: '100%',
            display: 'inline-block',
          }}
          dangerouslySetInnerHTML={{ __html: modifiedSvg }}
        />
      )
    }
    
    return (
      <div
        className={className}
        style={{
          width: size,
          height: calculatedHeight,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          maxWidth: '100%',
          display: 'inline-block',
        }}
      >
        <svg
          width={size}
          height={calculatedHeight}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
          }}
          dangerouslySetInnerHTML={{ __html: innerContent }}
        />
      </div>
    )
  }
  
  // Fall back to programmatic paths
  const paths = scribblePaths[variant] || scribblePaths[fileVariant] || scribblePaths.default
  // Use a hash of variant to get consistent but varied colors
  const variantHash = variant.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const baseColor = colors[variantHash % colors.length]
  
  // Scale stroke width with size (base 3px at 60px, scales proportionally)
  const baseStrokeWidth = (size / 60) * 3
  
  // Add slight rotation and position variation for more organic look
  const rotation = (variantHash % 20) - 10 // -10 to +10 degrees
  const translateX = (variantHash % 6) - 3 // -3 to +3 pixels
  const translateY = (variantHash % 6) - 3 // -3 to +3 pixels
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={className}
      style={{ 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
        maxWidth: '100%',
        height: 'auto',
      }}
    >
      <g transform={`translate(${30 + translateX}, ${30 + translateY}) rotate(${rotation}) translate(-30, -30)`}>
        {paths.map((path, i) => {
          // Vary stroke width and color slightly for each path (scaled with size)
          const strokeWidth = baseStrokeWidth + (i % 2) * (baseStrokeWidth * 0.2) + (i % 3) * (baseStrokeWidth * 0.15)
          const colorIndex = (variantHash + i) % colors.length
          const colorVariation = colors[colorIndex]
          
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={colorVariation}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: 0.85 - (i * 0.08),
              }}
            />
          )
        })}
      </g>
    </svg>
  )
}


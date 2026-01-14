'use client'

import { cn } from '@/lib/utils'

const tapeColors = [
  'from-yellow-200/50 to-yellow-300/50',
  'from-pink-200/50 to-pink-300/50',
  'from-blue-200/50 to-blue-300/50',
  'from-green-200/50 to-green-300/50',
]

const rotations = [-2, 1, -1, 2, 0, -1.5, 1.5, -0.5]

export function GallerySkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, index) => {
        const tapeColor = tapeColors[index % tapeColors.length]
        const rotation = rotations[index % rotations.length]
        
        return (
          <div
            key={index}
            className="relative animate-pulse"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Paper card */}
            <div className="relative bg-white rounded-sm shadow-md overflow-visible">
              {/* Decorative tape */}
              <div className={cn(
                "absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm",
                "bg-gradient-to-r shadow-sm z-10",
                "transform -rotate-1",
                tapeColor
              )} 
              style={{ 
                clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
              }}
              />
              
              {/* Image placeholder */}
              <div className="p-3 pb-0">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-sm" />
              </div>

              {/* Text placeholder */}
              <div className="p-3 pt-2 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-200" />
                    <div className="h-3 bg-gray-200 rounded w-16" />
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full w-12" />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


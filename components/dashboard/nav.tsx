'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, hasPermission, type Role } from '@/lib/utils'
import { 
  LayoutGrid, 
  Upload, 
  Users, 
  FolderHeart, 
  Baby,
  Settings,
  Heart,
  Sparkles,
  TrendingUp
} from 'lucide-react'

interface DashboardNavProps {
  role: string | null
  currentArtworks?: number
  artworkLimit?: number
}

export function DashboardNav({ role, currentArtworks = 0, artworkLimit = 100 }: DashboardNavProps) {
  const pathname = usePathname()
  const userRole = (role || 'viewer') as Role

  const navItems = [
    {
      label: 'Gallery',
      href: '/dashboard',
      icon: LayoutGrid,
      show: true,
      gradient: 'from-crayon-blue to-crayon-purple',
    },
    {
      label: 'Favorites',
      href: '/dashboard/favorites',
      icon: Heart,
      show: true,
      gradient: 'from-crayon-red to-crayon-pink',
    },
    {
      label: 'Timeline',
      href: '/dashboard/timeline',
      icon: TrendingUp,
      show: true,
      gradient: 'from-crayon-blue to-crayon-purple',
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: Sparkles,
      show: true,
      gradient: 'from-crayon-green to-crayon-blue',
    },
    {
      label: 'Upload',
      href: '/dashboard/upload',
      icon: Upload,
      show: hasPermission(userRole, 'addArtwork'),
      gradient: 'from-crayon-green to-crayon-blue',
    },
    {
      label: 'Children',
      href: '/dashboard/children',
      icon: Baby,
      show: true,
      gradient: 'from-crayon-yellow to-crayon-orange',
    },
    {
      label: 'Collections',
      href: '/dashboard/collections',
      icon: FolderHeart,
      show: true,
      gradient: 'from-crayon-purple to-crayon-pink',
    },
    {
      label: 'Family',
      href: '/dashboard/family',
      icon: Users,
      show: true,
      gradient: 'from-crayon-orange to-crayon-red',
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      show: true,
      gradient: 'from-gray-400 to-gray-600',
    },
  ]

  return (
    <nav 
      className="fixed left-0 top-16 bottom-0 w-64 bg-background/90 backdrop-blur-md border-r hidden lg:block overflow-y-auto"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="p-4 space-y-1" role="list">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive 
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-md` 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-transform duration-200',
                !isActive && 'group-hover:scale-110'
              )} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white/50 animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Quick Stats Card */}
      <div className="p-4 mt-4 border-t">
        <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30 rounded-2xl p-4 border border-orange-100 dark:border-orange-900/30 overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-crayon-yellow/20 to-crayon-orange/20 rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-crayon-orange" />
              <p className="text-sm font-semibold text-foreground">Free Plan</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Artworks</span>
                  <span className="font-medium">{currentArtworks} / {artworkLimit === -1 ? '∞' : artworkLimit}</span>
                </div>
                <div className="h-2.5 bg-white/70 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-crayon-orange to-crayon-pink rounded-full transition-all duration-500" 
                    style={{ 
                      width: artworkLimit === -1 
                        ? '0%' 
                        : `${Math.min(100, (currentArtworks / artworkLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
            
            <Link 
              href="/dashboard/billing" 
              className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline group"
            >
              Upgrade to Family Plan
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Fun footer decoration */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="text-center text-2xl opacity-40 hover:opacity-60 transition-opacity cursor-default">
          🎨 🖍️ ✨
        </div>
      </div>
    </nav>
  )
}

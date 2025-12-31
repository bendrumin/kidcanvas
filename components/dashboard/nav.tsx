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
  Heart
} from 'lucide-react'

interface DashboardNavProps {
  role: string | null
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname()
  const userRole = (role || 'viewer') as Role

  const navItems = [
    {
      label: 'Gallery',
      href: '/dashboard',
      icon: LayoutGrid,
      show: true,
    },
    {
      label: 'Favorites',
      href: '/dashboard/favorites',
      icon: Heart,
      show: true,
    },
    {
      label: 'Upload',
      href: '/dashboard/upload',
      icon: Upload,
      show: hasPermission(userRole, 'addArtwork'),
    },
    {
      label: 'Children',
      href: '/dashboard/children',
      icon: Baby,
      show: true,
    },
    {
      label: 'Collections',
      href: '/dashboard/collections',
      icon: FolderHeart,
      show: true,
    },
    {
      label: 'Family',
      href: '/dashboard/family',
      icon: Users,
      show: true,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      show: true,
    },
  ]

  return (
    <nav className="fixed left-0 top-16 bottom-0 w-64 bg-white/80 backdrop-blur-md border-r hidden lg:block overflow-y-auto">
      <div className="p-4 space-y-1">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive 
                  ? 'bg-gradient-to-r from-crayon-pink/10 to-crayon-purple/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5',
                isActive && 'text-primary'
              )} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="p-4 mt-4 border-t">
        <div className="bg-gradient-to-br from-crayon-yellow/20 to-crayon-orange/20 rounded-2xl p-4">
          <p className="text-sm font-medium mb-2">Free Plan</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Artworks</span>
                <span>0 / 100</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-gradient-to-r from-crayon-orange to-crayon-pink rounded-full" />
              </div>
            </div>
          </div>
          <Link 
            href="/dashboard/settings/billing" 
            className="block mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Upgrade to Family Plan →
          </Link>
        </div>
      </div>
    </nav>
  )
}


'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, hasPermission, type Role } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutGrid,
  Upload,
  Users,
  FolderHeart,
  Baby,
  Settings,
  Heart,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Plus
} from 'lucide-react'
import { Logo } from '@/components/logo'

interface MobileNavProps {
  role: string | null
  familyName?: string
}

export function MobileNav({ role, familyName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const userRole = (role || 'viewer') as Role

  // Organized navigation sections matching desktop
  const navSections = [
    {
      title: 'Browse',
      items: [
        {
          label: 'Gallery',
          href: '/dashboard',
          icon: LayoutGrid,
          show: true,
          color: 'from-crayon-blue to-crayon-purple',
        },
        {
          label: 'Favorites',
          href: '/dashboard/favorites',
          icon: Heart,
          show: true,
          color: 'from-crayon-red to-crayon-pink',
        },
        {
          label: 'Collections',
          href: '/dashboard/collections',
          icon: FolderHeart,
          show: true,
          color: 'from-crayon-purple to-crayon-pink',
        },
      ]
    },
    {
      title: 'Insights',
      items: [
        {
          label: 'Timeline',
          href: '/dashboard/timeline',
          icon: TrendingUp,
          show: true,
          color: 'from-crayon-blue to-crayon-purple',
        },
        {
          label: 'Analytics',
          href: '/dashboard/analytics',
          icon: Sparkles,
          show: true,
          color: 'from-crayon-green to-crayon-blue',
        },
      ]
    },
    {
      title: 'Manage',
      items: [
        {
          label: 'Children',
          href: '/dashboard/children',
          icon: Baby,
          show: true,
          color: 'from-crayon-yellow to-crayon-orange',
        },
        {
          label: 'Family',
          href: '/dashboard/family',
          icon: Users,
          show: true,
          color: 'from-crayon-orange to-crayon-red',
        },
        {
          label: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          show: true,
          color: 'from-gray-400 to-gray-600',
        },
      ]
    }
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-crayon-pink/10 to-crayon-purple/10">
          <SheetTitle className="flex items-center gap-2">
            <Logo size="sm" showText={true} />
            <div className="text-left">
              {familyName && (
                <p className="text-xs text-muted-foreground font-normal">{familyName}</p>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Upload CTA Button */}
          {hasPermission(userRole, 'addArtwork') && (
            <Link
              href="/dashboard/upload"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-md',
                pathname === '/dashboard/upload'
                  ? 'bg-gradient-to-r from-crayon-green to-crayon-blue text-white'
                  : 'bg-gradient-to-r from-crayon-green to-crayon-blue text-white hover:scale-105'
              )}
            >
              <Plus className="w-5 h-5" />
              Upload Artwork
            </Link>
          )}

          {/* Navigation Sections */}
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.filter(item => item.show).map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

      </SheetContent>
    </Sheet>
  )
}


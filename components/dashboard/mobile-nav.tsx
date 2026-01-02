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
  Palette,
  X
} from 'lucide-react'

interface MobileNavProps {
  role: string | null
  familyName?: string
}

export function MobileNav({ role, familyName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const userRole = (role || 'viewer') as Role

  const navItems = [
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
      label: 'Upload',
      href: '/dashboard/upload',
      icon: Upload,
      show: hasPermission(userRole, 'addArtwork'),
      color: 'from-crayon-green to-crayon-blue',
    },
    {
      label: 'Children',
      href: '/dashboard/children',
      icon: Baby,
      show: true,
      color: 'from-crayon-yellow to-crayon-orange',
    },
    {
      label: 'Collections',
      href: '/dashboard/collections',
      icon: FolderHeart,
      show: true,
      color: 'from-crayon-purple to-crayon-pink',
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shadow-[0_2px_8px_rgba(233,30,99,0.2)]">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="text-lg font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
                KidCanvas
              </span>
              {familyName && (
                <p className="text-xs text-muted-foreground font-normal">{familyName}</p>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="p-4 space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
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
        </nav>

        {/* Decorative bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gradient-to-t from-amber-50/50">
          <div className="flex justify-center gap-2 text-2xl">
            🎨 🖍️ ✏️ 🖌️
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


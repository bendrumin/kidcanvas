'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { MobileNav } from './mobile-nav'
import { FamilySwitcher } from './family-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  Palette, 
  Settings, 
  LogOut, 
  User,
  Bell,
  CreditCard,
  Sparkles
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Family } from '@/lib/supabase/types'

interface DashboardHeaderProps {
  user: SupabaseUser
  family: Family | null
  families: Family[]
  role: string | null
}

export function DashboardHeader({ user, family, families, role }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b"
      role="banner"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo & Family */}
        <div className="flex items-center gap-4">
          <MobileNav role={role} familyName={family?.name} />
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center shadow-[0_2px_8px_rgba(233,30,99,0.2)]">
              <Palette className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="hidden sm:block text-lg font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
              KidCanvas
            </span>
          </Link>
          
          {/* Family Switcher */}
          <div className="hidden md:block">
            <FamilySwitcher 
              families={families} 
              currentFamilyId={family?.id ?? null} 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="w-5 h-5" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="text-center py-6 px-4">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Notifications Coming Soon!</h3>
                <p className="text-sm text-muted-foreground">
                  We're working on notifications to let you know when new artwork is added or shared.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2 pr-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {userName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                  {role && (
                    <span className="text-xs font-normal text-primary capitalize mt-1">
                      {role}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Mobile Family Switcher */}
              {families.length > 1 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch Family
                  </DropdownMenuLabel>
                  {families.map((f) => (
                    <DropdownMenuItem 
                      key={f.id}
                      onClick={() => {
                        document.cookie = `selected_family=${f.id};path=/;max-age=${60 * 60 * 24 * 365}`
                        router.refresh()
                      }}
                      className="cursor-pointer"
                    >
                      {f.id === family?.id ? '✓ ' : '  '}{f.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/family" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Family Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing & Plans
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

'use client'

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
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { MobileNav } from './mobile-nav'
import { 
  Palette, 
  Settings, 
  LogOut, 
  User,
  Bell
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Family } from '@/lib/supabase/types'

interface DashboardHeaderProps {
  user: SupabaseUser
  family: Family | null
  role: string | null
}

export function DashboardHeader({ user, family, role }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b"
      role="banner"
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo & Family */}
        <div className="flex items-center gap-4">
          <MobileNav role={role} familyName={family?.name} />
          
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-display font-bold bg-gradient-to-r from-crayon-pink to-crayon-purple bg-clip-text text-transparent">
                KidCanvas
              </span>
              {family && (
                <span className="text-sm text-muted-foreground ml-2">
                  · {family.name}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-crayon-red rounded-full" />
          </Button>

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


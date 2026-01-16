'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getInitials, formatDate } from '@/lib/utils'
import { 
  MoreVertical, 
  Shield, 
  UserMinus, 
  Loader2,
  Crown,
  User
} from 'lucide-react'
import type { FamilyMember } from '@/lib/supabase/types'

interface MemberListProps {
  members: FamilyMember[]
  currentUserId: string
  currentUserRole: string
  memberEmails: Record<string, string>
  familyId: string
}

const roleConfig = {
  owner: { label: 'Owner', color: 'yellow', icon: Crown },
  parent: { label: 'Parent', color: 'purple', icon: Shield },
  member: { label: 'Member', color: 'blue', icon: User },
  viewer: { label: 'Viewer', color: 'secondary', icon: User },
} as const

export function MemberList({ 
  members, 
  currentUserId, 
  currentUserRole,
  memberEmails,
  familyId
}: MemberListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [removeMember, setRemoveMember] = useState<FamilyMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'parent'

  const canRemoveMember = (member: FamilyMember) => {
    if (member.user_id === currentUserId) return true // Can leave
    if (!canManageMembers) return false
    if (member.role === 'owner') return false
    if (currentUserRole === 'parent' && member.role === 'parent') return false
    return true
  }

  const handleRemove = async () => {
    if (!removeMember) return
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', removeMember.id)

      if (error) throw error

      if (removeMember.user_id === currentUserId) {
        toast({ title: 'You have left the family' })
        router.push('/')
      } else {
        toast({ title: 'Member removed successfully' })
        router.refresh()
      }
      
      setRemoveMember(null)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Couldn\'t remove member'
      toast({ title: 'Oops!', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const colorGradients = [
    'from-crayon-pink to-crayon-purple',
    'from-crayon-blue to-crayon-green',
    'from-crayon-orange to-crayon-red',
    'from-crayon-yellow to-crayon-orange',
    'from-crayon-purple to-crayon-blue',
  ]

  return (
    <>
      <div className="space-y-3">
        {members.map((member, index) => {
          const isCurrentUser = member.user_id === currentUserId
          const email = memberEmails[member.user_id] || 'Unknown'
          const role = roleConfig[member.role as keyof typeof roleConfig]
          const gradient = colorGradients[index % colorGradients.length]

          return (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className={`w-12 h-12 bg-gradient-to-br ${gradient} text-white`}>
                    <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-semibold`}>
                      {getInitials(member.nickname || email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {member.nickname || email.split('@')[0]}
                      </span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={role.color as 'yellow' | 'purple' | 'blue' | 'secondary'} className="text-xs">
                        <role.icon className="w-3 h-3 mr-1" />
                        {role.label}
                      </Badge>
                      <span>·</span>
                      <span>Joined {formatDate(member.joined_at)}</span>
                    </div>
                  </div>
                </div>

                {canRemoveMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isCurrentUser ? (
                        <DropdownMenuItem 
                          onClick={() => setRemoveMember(member)}
                          className="text-destructive"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Leave Family
                        </DropdownMenuItem>
                      ) : (
                        <>
                          {currentUserRole === 'owner' && member.role !== 'parent' && (
                            <DropdownMenuItem>
                              <Shield className="w-4 h-4 mr-2" />
                              Promote to Parent
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setRemoveMember(member)}
                            className="text-destructive"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Remove/Leave Confirmation */}
      <Dialog open={!!removeMember} onOpenChange={() => setRemoveMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removeMember?.user_id === currentUserId 
                ? 'Leave Family?' 
                : 'Remove Member?'
              }
            </DialogTitle>
            <DialogDescription>
              {removeMember?.user_id === currentUserId 
                ? 'Are you sure you want to leave this family? You will lose access to all artwork.'
                : `Are you sure you want to remove ${removeMember?.nickname || 'this member'}? They will lose access to all artwork.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMember(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {removeMember?.user_id === currentUserId ? 'Leave' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


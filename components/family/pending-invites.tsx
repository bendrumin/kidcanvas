'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { 
  Copy, 
  Trash2, 
  Clock,
  Check
} from 'lucide-react'
import type { FamilyInvite } from '@/lib/supabase/types'

interface PendingInvitesProps {
  invites: FamilyInvite[]
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = async (code: string, id: string) => {
    const link = `${window.location.origin}/invite/${code}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    toast({ title: 'Link copied!' })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteInvite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_invites')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({ title: 'Invite deleted' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete invite'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    }
  }

  const roleColors = {
    parent: 'purple',
    member: 'blue',
    viewer: 'secondary',
  } as const

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <Card key={invite.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crayon-yellow/30 to-crayon-orange/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-crayon-orange" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{invite.code}</span>
                  <Badge variant={roleColors[invite.role as keyof typeof roleColors]}>
                    {invite.role}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {invite.nickname && <span>{invite.nickname} · </span>}
                  {invite.invited_email && <span>{invite.invited_email} · </span>}
                  Expires {formatDate(invite.expires_at)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyLink(invite.code, invite.id)}
              >
                {copiedId === invite.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => deleteInvite(invite.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}


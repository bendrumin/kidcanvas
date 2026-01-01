'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'
import { 
  UserPlus, 
  Loader2, 
  Copy, 
  Check,
  Mail,
  Link2
} from 'lucide-react'

interface InviteButtonProps {
  familyId: string
  familyName: string
}

export function InviteButton({ familyId, familyName }: InviteButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'share'>('form')
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    role: 'member' as 'parent' | 'member' | 'viewer',
  })

  const resetForm = () => {
    setStep('form')
    setFormData({ nickname: '', email: '', role: 'member' })
    setInviteLink('')
    setInviteCode('')
    setCopied(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const code = generateInviteCode()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('family_invites') as any)
        .insert({
          family_id: familyId,
          code,
          role: formData.role,
          nickname: formData.nickname || null,
          invited_email: formData.email || null,
          created_by: user.id,
        })

      if (error) throw error

      const link = `${window.location.origin}/invite/${code}`
      setInviteLink(link)
      setInviteCode(code)
      setStep('share')
      
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create invite'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast({ title: 'Link copied!' })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm() }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-crayon-blue to-crayon-purple hover:opacity-90">
          <UserPlus className="w-5 h-5 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite to {familyName}
              </DialogTitle>
              <DialogDescription>
                Create an invite link to share with family members
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'parent' | 'member' | 'viewer') => 
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {formData.role === 'parent' && 'Parent'}
                        {formData.role === 'member' && 'Member'}
                        {formData.role === 'viewer' && 'Viewer'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4} className="min-w-[300px]">
                      <SelectItem value="parent" className="py-3">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">Parent</span>
                          <span className="text-xs text-muted-foreground">Can manage children, artwork, and invite others</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="member" className="py-3">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">Member</span>
                          <span className="text-xs text-muted-foreground">Can view and add artwork</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer" className="py-3">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">Viewer</span>
                          <span className="text-xs text-muted-foreground">Can only view artwork</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input
                    id="nickname"
                    placeholder="Grandma Sue"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    A friendly name to identify this person
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="grandma@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send them an email with the invite link
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Invite
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-crayon-green" />
                Invite Created!
              </DialogTitle>
              <DialogDescription>
                Share this link with {formData.nickname || 'your family member'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Invite Link</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyLink} variant="outline">
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Code: <span className="font-mono font-semibold">{inviteCode}</span> · Expires in 7 days
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={copyLink} className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    window.open(`mailto:${formData.email}?subject=Join our family on KidCanvas&body=You've been invited to join ${familyName} on KidCanvas! Click here to join: ${inviteLink}`)
                  }}
                  className="w-full"
                  disabled={!formData.email}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={resetForm} variant="outline">
                Create Another
              </Button>
              <Button onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}


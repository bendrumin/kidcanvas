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
  const [step, setStep] = useState<'options' | 'form' | 'share'>('options')
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    role: 'member' as 'parent' | 'member' | 'viewer',
  })

  const resetForm = () => {
    setStep('options')
    setFormData({ nickname: '', email: '', role: 'member' })
    setInviteLink('')
    setInviteCode('')
    setCopied(false)
  }

  const createInvite = async (email?: string, nickname?: string, role: 'parent' | 'member' | 'viewer' = 'member') => {
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
          role,
          nickname: nickname || null,
          invited_email: email || null,
          created_by: user.id,
        })

      if (error) throw error

      const link = `${window.location.origin}/invite/${code}`
      setInviteLink(link)
      setInviteCode(code)
      
      // Send email if email address was provided
      if (email) {
        try {
          const emailResponse = await fetch('/api/invite/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              inviteLink: link,
              familyName,
              nickname: nickname || null,
            }),
          })

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json().catch(() => ({}))
            console.error('Failed to send invite email:', errorData)
            // Don't throw - invite was created successfully, just email failed
            toast({
              title: 'Invite created',
              description: 'Invite link created, but email could not be sent. You can share the link manually.',
              variant: 'default',
            })
          } else {
            toast({
              title: 'Invite sent!',
              description: `Invitation email sent to ${email}`,
            })
          }
        } catch (emailError) {
          console.error('Error sending invite email:', emailError)
          // Don't throw - invite was created successfully
          toast({
            title: 'Invite created',
            description: 'Invite link created. You can share it manually.',
            variant: 'default',
          })
        }
      }
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createInvite(formData.email || undefined, formData.nickname || undefined, formData.role)
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
        {step === 'options' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite to {familyName}
              </DialogTitle>
              <DialogDescription>
                Choose how you'd like to invite a family member
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              <Button
                type="button"
                onClick={() => createInvite()}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-crayon-blue to-crayon-purple hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Get Invite Link
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Create a shareable link without entering details
              </p>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('form')}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email Invite
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Add email and optional details before creating invite
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite to {familyName}
              </DialogTitle>
              <DialogDescription>
                Create an invite with email and optional details
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
                <Button type="button" variant="outline" onClick={() => setStep('options')}>
                  Back
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
                {formData.email 
                  ? `Invitation email sent to ${formData.email}${formData.nickname ? ` (${formData.nickname})` : ''}`
                  : `Share this link with ${formData.nickname || 'your family member'}`
                }
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

              <div className="flex gap-3">
                <Button variant="outline" onClick={copyLink} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                {!formData.email && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      window.open(`mailto:?subject=Join our family on KidCanvas&body=You've been invited to join ${familyName} on KidCanvas! Click here to join: ${inviteLink}`)
                    }}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                )}
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


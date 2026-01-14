'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LimitReachedDialog } from '@/components/paywall/limit-reached-dialog'

export default function CreateFamilyPage() {
  const router = useRouter()
  const [familyName, setFamilyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ current: number; limit: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!familyName.trim()) {
      setError('Please enter a family name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('You must be logged in to create a family')
        setIsLoading(false)
        return
      }

      // Check limit first
      const limitResponse = await fetch('/api/limits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'family' }),
      })

      const limitCheck = await limitResponse.json()

      if (!limitCheck.allowed) {
        setLimitInfo({ current: limitCheck.current, limit: limitCheck.limit })
        setShowLimitDialog(true)
        setIsLoading(false)
        return
      }
      
      // Call RPC to create family
      const { error: rpcError } = await (supabase.rpc as any)('create_family_for_user', {
        family_name: familyName.trim()
      })

      if (rpcError) {
        throw rpcError
      }

      // Set the new family as selected
      const { data: memberships } = await supabase
        .from('family_members')
        .select('family_id')
        .order('joined_at', { ascending: false })
        .limit(1) as { data: { family_id: string }[] | null }
      
      if (memberships && memberships[0]) {
        document.cookie = `selected_family=${memberships[0].family_id};path=/;max-age=${60 * 60 * 24 * 365}`
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create family')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-fluid-2xl">Create a New Family</CardTitle>
          <CardDescription>
            Start a new family gallery to organize and share your children's artwork
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="familyName">Family Name</Label>
              <Input
                id="familyName"
                placeholder="e.g., The Smith Family"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is how your family will be identified in KidCanvas
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Family'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {limitInfo && (
        <LimitReachedDialog
          open={showLimitDialog}
          onOpenChange={setShowLimitDialog}
          limitType="family"
          current={limitInfo.current}
          limit={limitInfo.limit}
        />
      )}
    </div>
  )
}


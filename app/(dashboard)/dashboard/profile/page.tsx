import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { Mail, Calendar, Shield, Users } from 'lucide-react'
import Link from 'next/link'
import type { FamilyMemberWithFamily } from '@/lib/supabase/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get all family memberships
  const { data: memberships } = await supabase
    .from('family_members')
    .select('*, families(*)')
    .eq('user_id', user.id) as { data: FamilyMemberWithFamily[] | null }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-fluid-3xl font-display font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-crayon-pink to-crayon-purple text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-fluid-2xl">{userName}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member since {joinDate}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline">Edit Profile</Button>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* Family Memberships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Families
          </CardTitle>
          <CardDescription>
            Families you belong to and your role in each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership) => (
              <div 
                key={membership.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-crayon-yellow to-crayon-orange flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{membership.families?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(membership.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
                    <Shield className="w-3 h-3 mr-1" />
                    {membership.role}
                  </Badge>
                  <Link href="/dashboard/family">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>You're not part of any family yet</p>
              <Link href="/dashboard/family/create">
                <Button className="mt-4">Create a Family</Button>
              </Link>
            </div>
          )}
          
          {memberships && memberships.length > 0 && (
            <Link href="/dashboard/family/create">
              <Button variant="outline" className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Create Another Family
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates about your artwork</p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between py-2 border-t pt-4">
            <div>
              <p className="font-medium">Data Export</p>
              <p className="text-sm text-muted-foreground">Download all your data</p>
            </div>
            <Button variant="outline" size="sm">Export</Button>
          </div>
          <div className="flex items-center justify-between py-2 border-t pt-4">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive" size="sm">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


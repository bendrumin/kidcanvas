import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadForm } from '@/components/upload/upload-form'

export default async function UploadPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's family
  const { data: membership } = await supabase
    .from('family_members')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  // Check permission
  if (membership.role === 'viewer') {
    redirect('/dashboard')
  }

  // Get children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', membership.family_id)
    .order('name')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Upload Artwork</h1>
        <p className="text-muted-foreground mt-1">
          Add new artwork to your family's collection
        </p>
      </div>

      <UploadForm 
        familyId={membership.family_id} 
        children={children || []} 
        userId={user.id}
      />
    </div>
  )
}


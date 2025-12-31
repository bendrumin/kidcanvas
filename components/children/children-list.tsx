'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getInitials, calculateAge, formatDate } from '@/lib/utils'
import { 
  Palette, 
  Calendar, 
  Edit, 
  Trash2, 
  Loader2,
  Baby
} from 'lucide-react'
import type { Child } from '@/lib/supabase/types'

interface ChildWithCount extends Child {
  artworks: { count: number }[]
}

interface ChildrenListProps {
  children: ChildWithCount[]
  canManage: boolean
  familyId: string
}

export function ChildrenList({ children, canManage, familyId }: ChildrenListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [deleteChild, setDeleteChild] = useState<Child | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', birthDate: '' })

  const colorGradients = [
    'from-crayon-pink to-crayon-purple',
    'from-crayon-blue to-crayon-green',
    'from-crayon-orange to-crayon-red',
    'from-crayon-yellow to-crayon-orange',
    'from-crayon-purple to-crayon-blue',
  ]

  const openEdit = (child: Child) => {
    setEditChild(child)
    setEditForm({ name: child.name, birthDate: child.birth_date })
  }

  const handleEdit = async () => {
    if (!editChild) return
    setIsLoading(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('children') as any)
        .update({
          name: editForm.name,
          birth_date: editForm.birthDate,
        })
        .eq('id', editChild.id)

      if (error) throw error

      toast({ title: 'Child updated successfully' })
      setEditChild(null)
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteChild) return
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', deleteChild.id)

      if (error) throw error

      toast({ title: 'Child removed successfully' })
      setDeleteChild(null)
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete'
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (children.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-crayon-pink/30 to-crayon-purple/30 flex items-center justify-center mx-auto mb-4">
          <Baby className="w-10 h-10 text-crayon-purple" />
        </div>
        <h3 className="text-xl font-display font-bold mb-2">No children yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Add your children to start organizing their artwork by artist
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child, index) => {
          const artworkCount = child.artworks?.[0]?.count || 0
          const gradient = colorGradients[index % colorGradients.length]
          const age = calculateAge(child.birth_date, new Date().toISOString())

          return (
            <Card key={child.id} className="overflow-hidden group hover:shadow-lg transition-all">
              <div className={`h-24 bg-gradient-to-r ${gradient} relative`}>
                <div className="absolute inset-0 opacity-20">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="80" cy="20" r="30" fill="white" opacity="0.3" />
                    <circle cx="20" cy="70" r="20" fill="white" opacity="0.2" />
                  </svg>
                </div>
              </div>
              
              <div className="-mt-10 px-6 pb-6">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={child.avatar_url || ''} />
                  <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-2xl`}>
                    {getInitials(child.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="mt-3">
                  <h3 className="text-xl font-display font-bold">{child.name}</h3>
                  <p className="text-muted-foreground text-sm">{age}</p>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(child.birth_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Palette className="w-4 h-4" />
                    {artworkCount} artwork{artworkCount !== 1 ? 's' : ''}
                  </div>
                </div>

                {canManage && (
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" onClick={() => openEdit(child)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDeleteChild(child)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editChild} onOpenChange={() => setEditChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Child</DialogTitle>
            <DialogDescription>
              Update {editChild?.name}'s information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birth">Birth Date</Label>
              <Input
                id="edit-birth"
                type="date"
                value={editForm.birthDate}
                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditChild(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteChild} onOpenChange={() => setDeleteChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Child Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deleteChild?.name}? This will also delete all their artwork.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteChild(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


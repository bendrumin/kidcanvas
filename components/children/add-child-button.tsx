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
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, Baby } from 'lucide-react'

interface AddChildButtonProps {
  familyId: string
}

export function AddChildButton({ familyId }: AddChildButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('children')
        .insert({
          family_id: familyId,
          name: formData.name,
          birth_date: formData.birthDate,
        })

      if (error) throw error

      toast({
        title: 'Child added!',
        description: `${formData.name} has been added to your family.`,
      })

      setIsOpen(false)
      setFormData({ name: '', birthDate: '' })
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add child'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
          <Plus className="w-5 h-5 mr-2" />
          Add Child
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            Add a Child
          </DialogTitle>
          <DialogDescription>
            Add a new little artist to your family
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Child's Name</Label>
              <Input
                id="name"
                placeholder="Emma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                This helps calculate their age for each artwork
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Child
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


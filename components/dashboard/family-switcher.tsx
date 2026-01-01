'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useState } from 'react'
import type { Family } from '@/lib/supabase/types'

interface FamilySwitcherProps {
  families: Family[]
  currentFamilyId: string | null
}

export function FamilySwitcher({ families, currentFamilyId }: FamilySwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const currentFamily = families.find(f => f.id === currentFamilyId)

  const handleSelect = (familyId: string) => {
    // Set cookie for selected family
    document.cookie = `selected_family=${familyId};path=/;max-age=${60 * 60 * 24 * 365}`
    setOpen(false)
    router.refresh()
  }

  if (families.length <= 1) {
    // Don't show switcher if only one family
    return currentFamily ? (
      <span className="text-sm text-muted-foreground">
        {currentFamily.name}
      </span>
    ) : null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a family"
          className="w-[200px] justify-between"
        >
          <Users className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {currentFamily?.name || 'Select family...'}
          </span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search families..." />
          <CommandList>
            <CommandEmpty>No family found.</CommandEmpty>
            <CommandGroup heading="Your Families">
              {families.map((family) => (
                <CommandItem
                  key={family.id}
                  onSelect={() => handleSelect(family.id)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="truncate">{family.name}</span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      currentFamilyId === family.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push('/dashboard/family/create')
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Family
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


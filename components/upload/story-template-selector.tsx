'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, ChevronRight, Lightbulb } from 'lucide-react'
import {
  STORY_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type StoryTemplate
} from '@/lib/story-templates'

interface StoryTemplateSelectorProps {
  onSelectTemplate: (template: StoryTemplate) => void
  childName?: string
  disabled?: boolean
  isPremium?: boolean
}

export function StoryTemplateSelector({
  onSelectTemplate,
  childName,
  disabled = false,
  isPremium = false
}: StoryTemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplate | null>(null)

  const handleSelectTemplate = (template: StoryTemplate) => {
    // Replace [child name] placeholder with actual child name if provided
    const populatedTemplate = childName
      ? template.template.replace(/\[child name\]/gi, childName)
      : template.template

    onSelectTemplate({ ...template, template: populatedTemplate })
    setOpen(false)
    setSelectedCategory(null)
    setSelectedTemplate(null)
  }

  const handleBack = () => {
    if (selectedTemplate) {
      setSelectedTemplate(null)
    } else if (selectedCategory) {
      setSelectedCategory(null)
    }
  }

  const filteredTemplates = selectedCategory
    ? STORY_TEMPLATES.filter(t => t.category === selectedCategory)
    : STORY_TEMPLATES

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {isPremium ? 'Use Template' : 'Use Template (Premium)'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {selectedCategory && (
                  <button onClick={handleBack} className="hover:text-muted-foreground">
                    ←
                  </button>
                )}
                {selectedTemplate
                  ? selectedTemplate.title
                  : selectedCategory
                  ? TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.label
                  : 'Choose a Story Template'}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate
                  ? 'Fill in the prompts to create your story'
                  : selectedCategory
                  ? 'Select a template to get started'
                  : 'Templates help you capture the moment and emotions'}
              </DialogDescription>
            </div>
            {!isPremium && (
              <Badge variant="secondary" className="bg-gradient-to-r from-crayon-pink to-crayon-purple text-white">
                Premium
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Show template detail */}
          {selectedTemplate ? (
            <div className="space-y-6">
              {/* Template preview */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Template:</p>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.template}
                </p>
              </div>

              {/* Prompts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <span>Answer these prompts to complete your story:</span>
                </div>
                <ul className="space-y-2">
                  {selectedTemplate.prompts.map((prompt, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="font-semibold text-primary">{index + 1}.</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleSelectTemplate(selectedTemplate)}
                  className="flex-1 bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90"
                >
                  Use This Template
                </Button>
              </div>
            </div>
          ) : selectedCategory ? (
            /* Show templates in category */
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="w-full p-4 text-left rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl flex-shrink-0">{template.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          {template.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.template.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Show categories */
            <div className="space-y-2">
              {TEMPLATE_CATEGORIES.map((category) => {
                const templateCount = STORY_TEMPLATES.filter(
                  t => t.category === category.id
                ).length

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full p-4 text-left rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div>
                          <h4 className="font-semibold mb-0.5 group-hover:text-primary transition-colors">
                            {category.label}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {templateCount} templates
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {!isPremium && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Unlock Story Templates</p>
                <p className="text-muted-foreground text-xs">
                  Upgrade to Family or Pro plan to access all story templates and make capturing memories even easier!
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const faqs = [
  {
    q: 'How do I scan artwork?',
    a: 'Open the iOS app, tap the camera icon, and hold your phone over the artwork. It automatically detects edges and captures the image.',
  },
  {
    q: 'Can grandparents view the artwork?',
    a: 'Yes! Invite them to your family, or create shareable links for individual pieces. They don\'t need an account to view shared links.',
  },
  {
    q: 'What\'s included free?',
    a: 'Up to 50 artworks, 1 child profile, and 1 family group. Perfect for getting started!',
  },
  {
    q: 'How do I cancel?',
    a: 'Go to Settings → Billing. Cancel anytime — you keep access until the end of your billing period.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use industry-standard encryption and secure cloud storage. Your artwork is backed up and only accessible to your family.',
  },
]

export default function SupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('https://formspree.io/f/xjgkgovz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success('Message sent! We\'ll get back to you within 24 hours.')
        setFormData({ name: '', email: '', message: '' })
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Failed to send message. Please try again.')
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] dark:bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Need help?
        </h1>
        <p className="text-muted-foreground mb-8">
          We usually respond within 24 hours.
        </p>

        {/* Simple Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-16">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              placeholder="Describe your issue or question..."
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-[#E91E63] hover:bg-[#C2185B]">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </form>

        {/* Simple FAQ - No Accordion */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">
            Common questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i}>
                <p className="font-medium text-foreground mb-1">{faq.q}</p>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Simple footer links */}
        <div className="mt-12 pt-8 border-t border-amber-100 dark:border-border">
          <p className="text-sm text-muted-foreground">
            Also see: <Link href="/privacy" className="text-[#E91E63] hover:underline">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="text-[#E91E63] hover:underline">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

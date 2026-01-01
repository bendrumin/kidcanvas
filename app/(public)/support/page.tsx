'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const faqs = [
  {
    question: 'How do I scan artwork?',
    answer: 'Open the KidCanvas app, tap the camera icon, and hold your phone over the artwork. Our VisionKit scanner will automatically detect the edges and capture the image. You can also tap "Photos" to import existing images from your photo library.',
  },
  {
    question: 'Can grandparents view the artwork?',
    answer: 'Yes! You can create shareable links for individual artworks or entire collections. Just tap the "Share" button on any artwork and send the link to family members – they don\'t need an account to view.',
  },
  {
    question: 'How do I add a child profile?',
    answer: 'Go to the "Children" tab in the app or web dashboard and tap "Add Child." Enter their name and birth date to start organizing artwork by age.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure cloud storage (Cloudflare R2), and Supabase for authentication. Your artwork is backed up securely and accessible only to you and family members you invite.',
  },
  {
    question: 'What\'s included in the free plan?',
    answer: 'The free plan includes up to 50 artworks, 3 children profiles, 1 family group, and basic gallery features including public sharing links.',
  },
  {
    question: 'How do I upgrade to Family or Pro?',
    answer: 'Go to Settings → Billing & Plans in the web app or iOS app. You can upgrade to Family ($4.99/mo) for unlimited artworks and children, or Pro ($9.99/mo) for multiple families and advanced features.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel anytime from the Billing page. You\'ll continue to have access to premium features until the end of your billing period. Your artwork will remain accessible but you won\'t be able to add new items beyond the free tier limits.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'Contact us at support@kidcanvas.app to request account deletion. We\'ll delete all your data within 30 days. You can also export your artwork before deletion.',
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
    
    // Simulate form submission (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Message sent! We\'ll get back to you within 24 hours.')
    setFormData({ name: '', email: '', message: '' })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
          Support Center
        </h1>
        <p className="text-lg text-muted-foreground mb-12">
          We're here to help you preserve your family's precious artwork.
        </p>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Send us a message and we'll respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
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
            </CardContent>
          </Card>

          {/* Quick Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">
                  For general inquiries and support:
                </p>
                <a 
                  href="mailto:support@kidcanvas.app" 
                  className="text-primary font-medium hover:underline"
                >
                  support@kidcanvas.app
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Useful Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/privacy" className="block text-primary hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/#pricing" className="block text-primary hover:underline">
                  Pricing & Plans
                </Link>
                <Link href="/#features" className="block text-primary hover:underline">
                  Features
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}


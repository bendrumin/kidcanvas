import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | KidCanvas',
  description: 'Terms of Service for KidCanvas - the family art gallery app for preserving children\'s artwork.',
}
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to KidCanvas
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2026</p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using KidCanvas ("the Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                KidCanvas is a digital platform that allows families to scan, store, organize, and share 
                children's artwork. The Service includes web and mobile applications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must provide accurate and complete information</li>
                <li>You may not share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. User Content</h2>
              <p className="text-muted-foreground mb-4">
                You retain ownership of all content you upload to KidCanvas. By uploading content, you grant us 
                a limited license to store, display, and process your content solely to provide the Service.
              </p>
              <p className="text-muted-foreground mb-4">
                You are responsible for ensuring you have the right to upload any content, including artwork 
                created by your children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Upload content that violates any laws or regulations</li>
                <li>Upload inappropriate or offensive content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for any commercial purposes without permission</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Subscriptions and Payments</h2>
              <p className="text-muted-foreground mb-4">
                Some features require a paid subscription. Subscriptions are billed monthly or annually. 
                You may cancel your subscription at any time, and it will remain active until the end of 
                the billing period.
              </p>
              <p className="text-muted-foreground mb-4">
                Refunds are handled on a case-by-case basis. Please contact support for refund requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Privacy</h2>
              <p className="text-muted-foreground mb-4">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>{' '}
                to understand how we collect, use, and protect your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Termination</h2>
              <p className="text-muted-foreground mb-4">
                We reserve the right to suspend or terminate your account if you violate these terms. 
                You may also delete your account at any time through the Settings page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground mb-4">
                The Service is provided "as is" without warranties of any kind. We do not guarantee 
                uninterrupted or error-free service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                To the maximum extent permitted by law, KidCanvas shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We may update these terms from time to time. We will notify you of significant changes 
                via email or through the Service. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">12. Contact</h2>
              <p className="text-muted-foreground">
                Questions about these terms? Contact us at{' '}
                <Link href="/support" className="text-primary hover:underline">our support page</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}


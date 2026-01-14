import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - KidCanvas',
  description: 'KidCanvas privacy policy - how we protect your family\'s data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-fluid-4xl font-display font-bold text-foreground mb-8">
          Privacy Policy
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Last updated: December 31, 2024
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              KidCanvas ("we," "our," or "us") is committed to protecting the privacy of our users, 
              especially children's information. This Privacy Policy explains how we collect, use, 
              and protect your data when you use our iOS app and web application.
            </p>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground mt-4">Account Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Email address (for account creation and login)</li>
              <li>Name (optional, for personalization)</li>
              <li>Password (securely hashed, never stored in plain text)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Family & Children Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Child names and birth dates (to organize artwork by age)</li>
              <li>Family group names</li>
              <li>Artwork images and metadata (titles, dates, tags)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-4">Usage Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>App usage analytics (anonymized)</li>
              <li>Device information for troubleshooting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>To provide and improve our services</li>
              <li>To organize and display your family's artwork</li>
              <li>To enable sharing with family members</li>
              <li>To process payments for premium features</li>
              <li>To send important account notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Data Storage & Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li><strong>Database:</strong> Supabase (PostgreSQL with Row Level Security)</li>
              <li><strong>Image Storage:</strong> Cloudflare R2 (encrypted at rest)</li>
              <li><strong>Payments:</strong> Stripe (PCI-compliant, we never see your full card number)</li>
              <li><strong>Encryption:</strong> All data transmitted via HTTPS/TLS</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li><strong>Supabase:</strong> Authentication and database</li>
              <li><strong>Cloudflare:</strong> Image storage and delivery</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Web hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Children's Privacy (COPPA)</h2>
            <p className="text-muted-foreground leading-relaxed">
              KidCanvas is designed for parents and guardians to manage their children's artwork. 
              We do not collect personal information directly from children. All child profiles 
              are created and managed by adult account holders.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We collect only the minimum information necessary: child's name (or nickname) and 
              birth date to calculate their age when artwork was created.
            </p>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your data. We only share data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>With family members you invite to your family group</li>
              <li>Via public share links you explicitly create</li>
              <li>With service providers necessary to operate our app</li>
              <li>When required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correct:</strong> Update inaccurate information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your artwork and data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data as long as your account is active. If you delete your account, 
              we will delete your personal data within 30 days, except where required for legal 
              or business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or your data, contact us at:
            </p>
            <p className="text-muted-foreground mt-4">
              <strong>Support:</strong> <Link href="/support" className="text-primary hover:underline">Visit our Support Page</Link>
            </p>
          </section>

          <section>
            <h2 className="text-fluid-2xl font-semibold text-foreground">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by email or through the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Palette, Upload, Sparkles } from 'lucide-react'

export function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-crayon-yellow/30 to-crayon-orange/30 flex items-center justify-center">
          <Palette className="w-16 h-16 text-crayon-orange" />
        </div>
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br from-crayon-pink to-crayon-purple flex items-center justify-center animate-bounce">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
        Your Gallery Awaits!
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Start building your family's art collection. Upload your children's masterpieces 
        and watch your gallery come to life.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/dashboard/upload">
          <Button size="lg" className="bg-gradient-to-r from-crayon-pink to-crayon-purple hover:opacity-90">
            <Upload className="w-5 h-5 mr-2" />
            Upload First Artwork
          </Button>
        </Link>
        <Link href="/dashboard/children">
          <Button size="lg" variant="outline">
            Add Your Children First
          </Button>
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-4 gap-4 max-w-lg">
        {['🎨', '🖍️', '✏️', '🖌️'].map((emoji, i) => (
          <div 
            key={i}
            className="aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-4xl opacity-50"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  )
}


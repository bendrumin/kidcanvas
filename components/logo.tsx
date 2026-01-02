import Link from 'next/link'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string | null
  className?: string
  textClassName?: string
  iconClassName?: string
}

const sizeConfig = {
  xs: {
    icon: 'w-6 h-6',
    iconInner: 'w-3 h-3',
    text: 'text-sm',
    gap: 'gap-2',
    shadow: 'shadow-[0_2px_6px_rgba(233,30,99,0.2)]',
  },
  sm: {
    icon: 'w-8 h-8',
    iconInner: 'w-4 h-4',
    text: 'text-xl',
    gap: 'gap-2',
    shadow: 'shadow-[0_4px_12px_rgba(233,30,99,0.25)]',
  },
  md: {
    icon: 'w-9 h-9',
    iconInner: 'w-5 h-5',
    text: 'text-lg',
    gap: 'gap-2',
    shadow: 'shadow-[0_2px_8px_rgba(233,30,99,0.2)]',
  },
  lg: {
    icon: 'w-12 h-12',
    iconInner: 'w-7 h-7',
    text: 'text-3xl',
    gap: 'gap-2',
    shadow: 'shadow-[0_4px_12px_rgba(233,30,99,0.25)]',
  },
}

export function Logo({ 
  size = 'md', 
  showText = true, 
  href = '/',
  className,
  textClassName,
  iconClassName,
}: LogoProps) {
  const config = sizeConfig[size]
  
  const logoContent = (
    <div className={cn('flex items-center', config.gap, className)}>
      <div 
        className={cn(
          config.icon,
          'rounded-xl bg-gradient-to-br from-[#E91E63] to-[#9B59B6] flex items-center justify-center',
          config.shadow,
          iconClassName
        )}
        aria-hidden="true"
      >
        <Palette className={cn(config.iconInner, 'text-white')} />
      </div>
      {showText && (
        <span 
          className={cn(
            config.text,
            'font-display font-bold bg-gradient-to-r from-[#E91E63] to-[#9B59B6] bg-clip-text text-transparent',
            textClassName
          )}
        >
          KidCanvas
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex" aria-label="KidCanvas home">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}


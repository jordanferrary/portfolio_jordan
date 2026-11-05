import type { ComponentProps } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SectionHeadingProps extends ComponentProps<'div'> {
  eyebrow: string
  title: string
  highlight?: string
  description?: string
}

export function SectionHeading({ eyebrow, title, highlight, description, className, ...props }: SectionHeadingProps) {
  return (
    <div data-slot="section-heading" className={cn('section-heading', className)} {...props}>
      <p className="eyebrow"><Sparkles aria-hidden="true" className="size-3.5" />{eyebrow}</p>
      <h2>{title}{highlight ? <> <span className="gradient-text">{highlight}</span></> : null}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  )
}

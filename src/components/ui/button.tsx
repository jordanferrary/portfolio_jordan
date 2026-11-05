import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export const buttonVariants = tv({
  base: 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'border-primary bg-primary text-primary-foreground shadow-[0_0_24px_var(--color-primary-glow)] hover:bg-primary-hover',
      secondary: 'border-border bg-surface-raised text-foreground hover:border-primary/50 hover:bg-surface',
      ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-surface-raised hover:text-foreground',
    },
    size: {
      sm: 'h-9 px-3 text-xs',
      md: 'h-11 px-5 text-sm',
      lg: 'h-14 px-7 text-sm',
      icon: 'size-10 p-0',
    },
  },
  defaultVariants: { variant: 'secondary', size: 'md' },
})

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  iconAfter?: boolean
}

export function Button({ className, variant, size, iconAfter = false, children, ...props }: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {iconAfter ? <ArrowUpRight aria-hidden="true" className="size-4" /> : null}
    </button>
  )
}

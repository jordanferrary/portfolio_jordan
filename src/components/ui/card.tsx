import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends ComponentProps<'div'> {}

export function Card({ className, ...props }: CardProps) {
  return <div data-slot="card" className={cn('surface-card flex flex-col', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-base font-semibold tracking-tight text-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('min-w-0', className)} {...props} />
}

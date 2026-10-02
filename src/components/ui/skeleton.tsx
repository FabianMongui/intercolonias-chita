import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Pulso de skeleton permitido por §5.3; se anula con prefers-reduced-motion.
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }

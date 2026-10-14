import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Campo de texto táctil: 44 px de alto y 16 px de letra (iOS no hace zoom al enfocarlo). */
function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

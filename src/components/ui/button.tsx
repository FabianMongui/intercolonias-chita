import type { ComponentProps } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariantProps } from '@/components/ui/button-variants'

type ButtonProps = ComponentProps<'button'> &
  ButtonVariantProps & {
    asChild?: boolean
  }

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      // Evita envíos accidentales de formularios: por defecto type="button".
      type={asChild ? type : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }

import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const Sheet = SheetPrimitive.Root
const SheetClose = SheetPrimitive.Close

/**
 * Hoja inferior (bottom sheet) para el celular. Animación permitida por §5.3 (aparición de hojas);
 * sin desenfoque de fondo (rendimiento en gama media).
 */
function SheetContent({ className, children, ...props }: ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col gap-4 rounded-t-2xl border-t bg-surface pb-[env(safe-area-inset-bottom)] text-foreground shadow-lg duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-10 sm:mx-auto sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" aria-label="Cerrar">
            <X aria-hidden />
          </Button>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1 px-4 pt-4 pr-14', className)} {...props} />
}

function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('font-display text-3xl leading-none', className)} {...props} />
}

function SheetDescription({ className, ...props }: ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle }

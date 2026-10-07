import { cn } from '@/lib/utils'

/**
 * Indicador EN VIVO (§4.1): punto rojo con pulso suave + texto (el color no es el único indicador).
 * Fondo blanco propio para mantener 4.8:1 del rojo aunque la tarjeta sea crema.
 */
export function IndicadorEnVivo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-live bg-surface px-2.5 py-0.5 text-sm leading-5 font-bold tracking-wide text-live uppercase',
        className,
      )}
    >
      <span aria-hidden className="size-2 rounded-full bg-live animate-pulso-en-vivo" />
      En vivo
    </span>
  )
}

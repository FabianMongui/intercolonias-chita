import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MarcadorProps {
  golesLocal: number
  golesVisitante: number
  penalesLocal?: number | null
  penalesVisitante?: number | null
  tamano?: 'md' | 'lg'
  className?: string
}

/** Número del marcador con "pop" solo cuando cambia (no al montar). §5.3; reduced-motion lo anula. */
function Numero({ valor }: { valor: number }) {
  const [previo, setPrevio] = useState(valor)
  const [cambios, setCambios] = useState(0)
  // Patrón "guardar el valor anterior durante el render" de React (sin efecto).
  if (valor !== previo) {
    setPrevio(valor)
    setCambios((c) => c + 1)
  }
  return (
    <span
      // La key nueva reinicia la animación en cada cambio.
      key={cambios}
      className={cn(
        'inline-block min-w-[1ch] text-center',
        cambios > 0 && 'animate-pop-marcador motion-reduce:animate-none',
      )}
    >
      {valor}
    </span>
  )
}

/** Marcador "2 – 1" con penales opcionales "(4-3 pen.)". Texto accesible "2 a 1". */
export function Marcador({
  golesLocal,
  golesVisitante,
  penalesLocal,
  penalesVisitante,
  tamano = 'md',
  className,
}: MarcadorProps) {
  const hayPenales = penalesLocal != null && penalesVisitante != null
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <p className="sr-only">
        {golesLocal} a {golesVisitante}
        {hayPenales && `, penales ${String(penalesLocal)} a ${String(penalesVisitante)}`}
      </p>
      <p
        aria-hidden
        className={cn(
          'marcador flex items-center gap-2 text-foreground',
          tamano === 'lg' ? 'text-6xl' : 'text-4xl',
        )}
      >
        <Numero valor={golesLocal} />
        <span className="text-muted-foreground">–</span>
        <Numero valor={golesVisitante} />
      </p>
      {hayPenales && (
        <p aria-hidden className="text-sm font-semibold text-muted-foreground tabular-nums">
          ({penalesLocal}-{penalesVisitante} pen.)
        </p>
      )}
    </div>
  )
}

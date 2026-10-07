import { type RefObject, useEffect, useRef, useState } from 'react'
import { useAhoraServidor } from '@/hooks/useAhoraServidor'
import { usePestanaVisible } from '@/hooks/usePestanaVisible'
import { type DatosReloj, minutoPartido } from '@/lib/reloj'
import { cn } from '@/lib/utils'

interface RelojProps {
  partido: DatosReloj
  minutosPorTiempo: number
  desfaseMs: number
  className?: string
}

/** true mientras el elemento está en pantalla y la pestaña visible (§3.8: solo relojes visibles). */
function useVisibleEnPantalla(ref: RefObject<Element | null>): boolean {
  const [enPantalla, setEnPantalla] = useState(false)
  const pestanaVisible = usePestanaVisible()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observador = new IntersectionObserver((entradas) => {
      const entrada = entradas[entradas.length - 1]
      if (entrada) setEnPantalla(entrada.isIntersecting)
    })
    observador.observe(el)
    return () => {
      observador.disconnect()
    }
  }, [ref])

  return enPantalla && pestanaVisible
}

/** Minuto del partido en vivo con la hora del servidor. Se actualiza cada segundo solo si se ve. */
export function Reloj({ partido, minutosPorTiempo, desfaseMs, className }: RelojProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useVisibleEnPantalla(ref)
  const corre = partido.estado === 'en_vivo' && partido.periodo !== 'descanso'
  const ahora = useAhoraServidor(desfaseMs, 1000, visible && corre)
  // Sin hora del servidor no se inventa un minuto.
  const { texto, enAdicion } =
    ahora === undefined
      ? { texto: '', enAdicion: false }
      : minutoPartido(partido, minutosPorTiempo, ahora)

  return (
    <span
      ref={ref}
      // No anunciar cada segundo; el lector lee el valor al llegar al elemento.
      aria-live="off"
      className={cn(
        'marcador inline-block min-w-[4ch] rounded-sm text-center tabular-nums',
        className,
        // Adición: chip amarillo con texto café (9.9:1), distinto del minuto normal.
        enAdicion && 'bg-accent px-1.5 text-accent-foreground',
      )}
    >
      {texto}
    </span>
  )
}

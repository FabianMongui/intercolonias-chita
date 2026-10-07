import { useEffect, useState } from 'react'
import { ahoraServidor } from '@/lib/time'

/**
 * Hora del servidor (ms) que se refresca cada `intervaloMs` mientras `activo` sea true.
 * Devuelve undefined hasta conocer el desfase. Solo para presentación (reloj, "en X min").
 */
export function useAhoraServidor(
  desfaseMs: number | undefined,
  intervaloMs: number,
  activo = true,
): number | undefined {
  const [ahora, setAhora] = useState<number | undefined>(() =>
    desfaseMs === undefined ? undefined : ahoraServidor(desfaseMs).getTime(),
  )

  useEffect(() => {
    if (desfaseMs === undefined || !activo) return
    const tic = () => {
      setAhora(ahoraServidor(desfaseMs).getTime())
    }
    // Al volver a ser visible (o al llegar el desfase) se pinta enseguida, sin esperar el intervalo.
    const inmediato = window.setTimeout(tic, 0)
    const id = window.setInterval(tic, intervaloMs)
    return () => {
      window.clearTimeout(inmediato)
      window.clearInterval(id)
    }
  }, [desfaseMs, intervaloMs, activo])

  return desfaseMs === undefined ? undefined : ahora
}

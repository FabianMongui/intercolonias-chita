import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useDesfaseServidor } from '@/hooks/useDesfaseServidor'
import { ahoraServidor, formatearHora } from '@/lib/time'

/** Hora del servidor en Bogotá, independiente del reloj del celular. */
export function HoraOficial() {
  const { data: desfase, isError } = useDesfaseServidor()
  const [, setTic] = useState(0)

  // Vuelve a pintar justo cuando cambia el minuto según la hora del servidor.
  useEffect(() => {
    if (desfase === undefined) return
    let id: number
    const programar = () => {
      const msHastaMinuto = 60_000 - (ahoraServidor(desfase).getTime() % 60_000)
      id = window.setTimeout(() => {
        setTic((t) => t + 1)
        programar()
      }, msHastaMinuto)
    }
    programar()
    return () => {
      window.clearTimeout(id)
    }
  }, [desfase])

  let hora = '--:--'
  if (desfase !== undefined) hora = formatearHora(ahoraServidor(desfase))
  else if (isError) hora = 'no disponible'

  return (
    <p className="flex min-h-6 items-center gap-2 text-sm text-muted-foreground">
      <Clock aria-hidden className="size-4" />
      Hora oficial:{' '}
      <span className="font-semibold tabular-nums text-foreground">{hora}</span>
    </p>
  )
}

import { formatearHora } from '@/lib/time'

interface TextoHoraProps {
  partido: { hora_programada: string | null; hora_estimada: string | null }
  /** Variante corta para espacios chicos: "10:00 · aprox 10:25" (sin "Programado"). */
  corto?: boolean
}

/**
 * Hora de un partido pendiente en Bogotá (§3.3): "10:00", "Programado 10:00 · aprox 10:25"
 * cuando la estimada difiere, o "Hora por definir". Las horas las calcula la base.
 */
export function TextoHora({ partido, corto = false }: TextoHoraProps) {
  const { hora_programada: programada, hora_estimada: estimada } = partido
  if (!programada) {
    return estimada ? (
      <>
        aprox <span className="tabular-nums">{formatearHora(estimada)}</span>
      </>
    ) : (
      <>Hora por definir</>
    )
  }
  const hora = formatearHora(programada)
  // Se compara ya redondeado al minuto: si da lo mismo, no se muestra la diferencia.
  const aprox = estimada ? formatearHora(estimada) : hora
  if (aprox !== hora) {
    return (
      <>
        {!corto && 'Programado '}
        <span className="whitespace-nowrap tabular-nums">{hora}</span>{' '}
        <span className="whitespace-nowrap">
          · aprox{' '}
          <span className={corto ? 'font-semibold tabular-nums' : 'font-semibold text-foreground tabular-nums'}>
            {aprox}
          </span>
        </span>
      </>
    )
  }
  return <span className="tabular-nums">{hora}</span>
}

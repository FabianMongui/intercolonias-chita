/**
 * Texto para mostrar mientras un equipo de eliminatoria aún no está definido (§3.3).
 * Solo traduce la referencia que guarda la base; quién clasifica lo resuelve la base.
 *   "1A"   → "1° Grupo A"
 *   "G:12" → "Ganador Semifinal 1"  (etiqueta del partido 12)
 *   "P:12" → "Perdedor Semifinal 1"
 */
export function textoReferencia(
  ref: string | null | undefined,
  etiquetaPartido: (id: number) => string | null | undefined,
): string {
  if (!ref) return 'Por definir'

  const grupo = /^(\d+)([A-Z]{1,2})$/.exec(ref)
  if (grupo) return `${grupo[1] ?? ''}° Grupo ${grupo[2] ?? ''}`

  const partido = /^([GP]):(\d+)$/.exec(ref)
  if (partido) {
    const id = Number(partido[2])
    const quien = partido[1] === 'G' ? 'Ganador' : 'Perdedor'
    return `${quien} ${etiquetaPartido(id) ?? `partido ${String(id)}`}`
  }

  return ref
}

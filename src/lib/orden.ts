/**
 * Hora con la que se ordena un partido para mostrarlo: la estimada si la base ya la ajustó por
 * retrasos (§3.3), si no la programada. Sin hora → al final.
 */
export function horaReferencia(p: { hora_estimada: string | null; hora_programada: string | null }): number {
  const hora = p.hora_estimada ?? p.hora_programada
  return hora ? Date.parse(hora) : Number.POSITIVE_INFINITY
}

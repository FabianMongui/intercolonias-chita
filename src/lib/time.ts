import { supabase } from '@/lib/supabase'

export const ZONA_HORARIA = 'America/Bogota'
// Colombia no tiene horario de verano: el offset es fijo.
export const OFFSET_BOGOTA = '-05:00'

const formatoHora = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const formatoFechaLarga = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const formatoRangoFechas = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Columna `date` ('2026-11-07') como instante del inicio de ese día en Bogotá. */
function fechaBogota(fecha: string): Date {
  return new Date(`${fecha}T00:00:00${OFFSET_BOGOTA}`)
}

/** `timestamptz` o Date → '14:05' en hora de Bogotá. */
export function formatearHora(instante: string | Date): string {
  return formatoHora.format(new Date(instante))
}

// en-CA da el formato ISO 'YYYY-MM-DD'.
const formatoClaveDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** `timestamptz` → día en Bogotá como 'YYYY-MM-DD' (para agrupar por día). */
export function claveDia(instante: string | Date): string {
  return formatoClaveDia.format(new Date(instante))
}

const formatoDiaCorto = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  weekday: 'short',
  day: 'numeric',
})

/** `timestamptz` → 'sáb 7' (día en Bogotá, para espacios chicos). */
export function formatearDiaCorto(instante: string | Date): string {
  return formatoDiaCorto.format(new Date(instante)).replace(/[.,]/g, '')
}

/** Columna `date` → 'sábado, 7 de noviembre'. */
export function formatearFechaLarga(fecha: string): string {
  return formatoFechaLarga.format(fechaBogota(fecha))
}

/** Dos columnas `date` → '7 – 8 de noviembre de 2026'. */
export function formatearRangoFechas(inicio: string, fin: string): string {
  return formatoRangoFechas.formatRange(fechaBogota(inicio), fechaBogota(fin))
}

/**
 * Desfase en ms entre el reloj del servidor y el del celular (`servidor − local`).
 * Compensa la mitad del tiempo de ida y vuelta de la petición.
 */
export async function obtenerDesfaseServidor(): Promise<number> {
  const antes = Date.now()
  const { data, error } = await supabase.rpc('ahora')
  const despues = Date.now()
  if (error) throw error
  return new Date(data).getTime() - (antes + despues) / 2
}

/** Hora actual según el servidor, dado el desfase de `obtenerDesfaseServidor`. */
export function ahoraServidor(desfaseMs: number): Date {
  return new Date(Date.now() + desfaseMs)
}

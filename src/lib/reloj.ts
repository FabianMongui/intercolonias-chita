/**
 * Minuto visible del partido (§3.8). Solo es presentación: los instantes (`inicio_real`,
 * `inicio_segundo_tiempo`) los fija el servidor y `ahoraMs` debe venir de `ahoraServidor`.
 */

export interface DatosReloj {
  estado: string
  periodo: string | null
  inicio_real: string | null
  inicio_segundo_tiempo: string | null
}

export interface MinutoPartido {
  /** "23'", "45+2'", "Descanso", "Final" o "" (sin reloj). */
  texto: string
  /** true cuando se pasó del tiempo reglamentario del periodo. */
  enAdicion: boolean
}

const SIN_RELOJ: MinutoPartido = { texto: '', enAdicion: false }

/** Minuto en curso (base 1) desde `inicio`, nunca menor que 1 aunque los relojes difieran. */
function minutoDesde(inicio: string, ahoraMs: number): number | null {
  const inicioMs = Date.parse(inicio)
  if (Number.isNaN(inicioMs)) return null
  return Math.max(1, Math.floor((ahoraMs - inicioMs) / 60_000) + 1)
}

/** "45+2'" si `minuto` pasa de `limite`; si no, "23'". */
function conAdicion(minuto: number, limite: number): MinutoPartido {
  if (minuto > limite) return { texto: `${String(limite)}+${String(minuto - limite)}'`, enAdicion: true }
  return { texto: `${String(minuto)}'`, enAdicion: false }
}

export function minutoPartido(
  p: DatosReloj,
  minutosPorTiempo: number,
  ahoraMs: number,
): MinutoPartido {
  if (p.estado === 'finalizado') return { texto: 'Final', enAdicion: false }
  if (p.estado !== 'en_vivo') return SIN_RELOJ

  switch (p.periodo) {
    case 'descanso':
      return { texto: 'Descanso', enAdicion: false }
    case '1T': {
      if (!p.inicio_real) return SIN_RELOJ
      const minuto = minutoDesde(p.inicio_real, ahoraMs)
      return minuto === null ? SIN_RELOJ : conAdicion(minuto, minutosPorTiempo)
    }
    case '2T': {
      if (!p.inicio_segundo_tiempo) return SIN_RELOJ
      const minuto = minutoDesde(p.inicio_segundo_tiempo, ahoraMs)
      return minuto === null
        ? SIN_RELOJ
        : conAdicion(minutosPorTiempo + minuto, minutosPorTiempo * 2)
    }
    default:
      return SIN_RELOJ
  }
}

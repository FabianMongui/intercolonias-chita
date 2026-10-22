/**
 * Canal mínimo entre el Realtime (useTiempoReal) y el aviso de gol: el hook publica los goles nuevos y
 * los eventos borrados (gol anulado); el aviso se suscribe. Sin estado global de React a propósito.
 */
export interface GolNuevo {
  eventoId: number
  partidoId: number
  equipoId: number
  jugadorId: number | null
  minuto: number | null
}

type Aviso = { tipo: 'gol'; gol: GolNuevo } | { tipo: 'anulado'; eventoId: number }

const oyentes = new Set<(aviso: Aviso) => void>()

export function publicarAviso(aviso: Aviso) {
  for (const oyente of oyentes) oyente(aviso)
}

export function escucharAvisos(oyente: (aviso: Aviso) => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

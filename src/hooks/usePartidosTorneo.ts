import { useCallback, useMemo } from 'react'
import { useDesfaseServidor } from '@/hooks/useDesfaseServidor'
import { usePartidos } from '@/hooks/usePartidos'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'

/** Duración por defecto si la categoría no se encuentra (no debería pasar). */
const MINUTOS_POR_TIEMPO_DEFECTO = 45

/**
 * Datos que comparten las pantallas de partidos: torneo activo, todos sus partidos,
 * desfase con el reloj del servidor y la etiqueta de cada partido (para "Ganador Semifinal 1").
 */
export function usePartidosTorneo() {
  const torneoQ = useTorneoActivo()
  const torneo = torneoQ.data
  const categoriaIds = useMemo(() => torneo?.categorias.map((c) => c.id) ?? [], [torneo])
  const partidosQ = usePartidos(torneo?.id, categoriaIds)
  const { data: desfaseMs } = useDesfaseServidor()

  const partidos = useMemo(() => partidosQ.data ?? [], [partidosQ.data])

  const etiquetas = useMemo(() => new Map(partidos.map((p) => [p.id, p.etiqueta])), [partidos])
  const etiquetaPartido = useCallback((id: number) => etiquetas.get(id), [etiquetas])

  const minutosPorTiempo = useCallback(
    (categoriaId: number) =>
      torneo?.categorias.find((c) => c.id === categoriaId)?.minutos_por_tiempo ??
      MINUTOS_POR_TIEMPO_DEFECTO,
    [torneo],
  )

  const nombreCategoria = useCallback(
    (categoriaId: number) => torneo?.categorias.find((c) => c.id === categoriaId)?.nombre ?? '',
    [torneo],
  )

  return {
    torneo,
    partidos,
    desfaseMs,
    etiquetaPartido,
    minutosPorTiempo,
    nombreCategoria,
    // Sin torneo (o sin categorías) no hay partidos que pedir: no cuenta como "cargando".
    cargando: torneoQ.isPending || (categoriaIds.length > 0 && partidosQ.isPending),
    error: torneoQ.isError || partidosQ.isError,
    reintentando: torneoQ.isRefetching || partidosQ.isRefetching,
    reintentar: () => {
      void torneoQ.refetch()
      void partidosQ.refetch()
    },
  }
}

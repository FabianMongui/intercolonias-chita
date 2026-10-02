import type { QueryData } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { type Calculadas, COLUMNAS_CALCULADAS, SELECT_PARTIDO } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'

const SELECT_DETALLE = `${SELECT_PARTIDO},
  categoria:categorias(id, nombre, minutos_por_tiempo),
  eventos(id, tipo, autogol, minuto, periodo, equipo_id, created_at,
    jugador:jugadores(id, nombre, numero))` as const

// Solo para inferir el tipo; no se ejecuta.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- solo se usa en `typeof`
const consultaTipada = () => supabase.from('partidos').select(SELECT_DETALLE).single()
export type PartidoDetalle = QueryData<ReturnType<typeof consultaTipada>> & Calculadas

async function obtenerPartido(id: number) {
  const { data, error } = await supabase
    .from('partidos')
    .select(`${SELECT_DETALLE}, ${COLUMNAS_CALCULADAS}`)
    .eq('id', id)
    // Cronología del partido aunque el admin registre un gol tarde.
    .order('periodo', { referencedTable: 'eventos' })
    .order('minuto', { referencedTable: 'eventos', nullsFirst: false })
    .order('created_at', { referencedTable: 'eventos' })
    .maybeSingle()
    .overrideTypes<PartidoDetalle | null, { merge: false }>()
  if (error) throw error
  return data
}

export function usePartido(id: number) {
  return useQuery({
    queryKey: ['partido', id],
    queryFn: () => obtenerPartido(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

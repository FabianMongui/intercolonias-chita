import type { QueryData } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Columnas que necesitan las tarjetas y listas de partidos.
export const SELECT_PARTIDO = `
  *,
  local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_path),
  visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_path),
  cancha:canchas(id, nombre, tipo),
  grupo:grupos(id, nombre)
` as const

/**
 * `ganador`/`perdedor` son columnas calculadas en la base (§3.4). El parser de tipos de
 * supabase-js no las reconoce, así que se piden aparte en el select y se tipan a mano.
 */
export const COLUMNAS_CALCULADAS = 'ganador, perdedor'
export interface Calculadas {
  ganador: number | null
  perdedor: number | null
}

// Solo para inferir el tipo de la parte que el parser sí entiende; no se ejecuta.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- solo se usa en `typeof`
const consultaTipada = () => supabase.from('partidos').select(SELECT_PARTIDO)
export type Partido = QueryData<ReturnType<typeof consultaTipada>>[number] & Calculadas

async function obtenerPartidos(categoriaIds: number[]) {
  const { data, error } = await supabase
    .from('partidos')
    .select(`${SELECT_PARTIDO}, ${COLUMNAS_CALCULADAS}`)
    .in('categoria_id', categoriaIds)
    .order('hora_programada', { ascending: true, nullsFirst: false })
    .order('id')
    .overrideTypes<Partido[], { merge: false }>()
  if (error) throw error
  return data
}

/** Todos los partidos del torneo (unas decenas): cada pantalla filtra por categoría, cancha o equipo. */
export function usePartidos(torneoId: number | undefined, categoriaIds: number[]) {
  return useQuery({
    // Los ids van en la key para que una categoría nueva no deje la caché vieja.
    // Realtime invalida por el prefijo ['partidos'].
    queryKey: ['partidos', torneoId, categoriaIds],
    queryFn: () => obtenerPartidos(categoriaIds),
    enabled: torneoId !== undefined && categoriaIds.length > 0,
  })
}

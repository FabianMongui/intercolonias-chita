import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

const CLAVES = ['historial-config', 'historial', 'ajustes']

/** Interruptor "mostrar el Historial al público" (una sola fila en ajustes). */
export function useAjustes() {
  return useQuery({
    queryKey: ['ajustes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ajustes').select('historial_publico').eq('id', 1).single()
      if (error) throw error
      return data
    },
  })
}

/** Lo que muestra el panel: ranking, títulos de la app (de las finales) y los cargados a mano. */
async function obtenerHistorial() {
  const [ranking, palmares, registros] = await Promise.all([
    supabase.from('titulos_por_club').select('*'),
    supabase.from('palmares').select('*').eq('origen', 'app').order('anio', { ascending: false }),
    supabase
      .from('campeones_historicos')
      .select(
        'id, anio, tipo_torneo, categoria, campeon_club_id, subcampeon_club_id, marcador_final, nota, campeon:clubes!campeones_historicos_campeon_club_id_fkey(nombre, escudo_path), subcampeon:clubes!campeones_historicos_subcampeon_club_id_fkey(nombre)',
      )
      .order('anio', { ascending: false })
      .order('categoria'),
  ])
  if (ranking.error) throw ranking.error
  if (palmares.error) throw palmares.error
  if (registros.error) throw registros.error
  return { ranking: ranking.data, desdeApp: palmares.data, registros: registros.data }
}

export type HistorialConfig = Awaited<ReturnType<typeof obtenerHistorial>>
export type RegistroCampeon = HistorialConfig['registros'][number]

export function useHistorialConfig() {
  return useQuery({ queryKey: ['historial-config'], queryFn: obtenerHistorial })
}

export type DatosCampeon = Pick<
  Database['public']['Tables']['campeones_historicos']['Insert'],
  'anio' | 'tipo_torneo' | 'categoria' | 'campeon_club_id' | 'subcampeon_club_id' | 'marcador_final' | 'nota'
>

export function useMutacionesHistorial() {
  const visibilidad = useMutacionConfig(async (historialPublico: boolean) => {
    const { data, error } = await supabase
      .from('ajustes')
      .update({ historial_publico: historialPublico })
      .eq('id', 1)
      .select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo cambiar la visibilidad del Historial.')
  }, CLAVES)

  const guardar = useMutacionConfig(async ({ id, datos }: { id: number | null; datos: DatosCampeon }) => {
    const { error } = id
      ? await supabase.from('campeones_historicos').update(datos).eq('id', id)
      : await supabase.from('campeones_historicos').insert(datos)
    if (error) {
      if (error.code === '23505') throw new Error('Ya hay un campeón cargado para ese año, tipo de torneo y categoría.')
      throw error
    }
  }, CLAVES)

  const borrar = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('campeones_historicos').delete().eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar el registro.')
  }, CLAVES)

  return { visibilidad, guardar, borrar }
}

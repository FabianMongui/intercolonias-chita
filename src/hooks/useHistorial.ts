import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** ¿El super admin activó el Historial para el público? (ajustes.historial_publico). */
export function useHistorialVisible() {
  return useQuery({
    queryKey: ['historial', 'visible'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ajustes').select('historial_publico').eq('id', 1).maybeSingle()
      if (error) throw error
      return data?.historial_publico ?? false
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * Campeones y ranking de títulos. Las vistas ya devuelven 0 filas al público si el Historial está oculto;
 * el super admin con sesión los ve igual (vista previa).
 */
async function obtenerHistorial() {
  const [palmares, ranking] = await Promise.all([
    supabase.from('palmares').select('*').order('anio', { ascending: false }).order('categoria'),
    supabase.from('titulos_por_club').select('*'),
  ])
  if (palmares.error) throw palmares.error
  if (ranking.error) throw ranking.error
  return { palmares: palmares.data, ranking: ranking.data }
}

export type Historial = Awaited<ReturnType<typeof obtenerHistorial>>
export type FilaPalmares = Historial['palmares'][number]

export function useHistorial() {
  return useQuery({ queryKey: ['historial', 'datos'], queryFn: obtenerHistorial })
}

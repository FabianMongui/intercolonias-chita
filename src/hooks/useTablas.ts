import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Vista `posiciones_en_vivo`: como la oficial (la base calcula y ordena con los desempates), pero suma los
 * partidos en juego con su marcador actual y trae `en_juego` y `posicion_oficial` (para las flechas).
 * La oficial (`posiciones`, solo finalizados) es la que usa la base para definir clasificados.
 */
export function usePosiciones(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['posiciones', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posiciones_en_vivo')
        .select('*')
        .eq('categoria_id', categoriaId ?? 0)
        .order('grupo')
        .order('posicion')
      if (error) throw error
      return data
    },
    enabled: categoriaId !== undefined,
  })
}

/** Vista `goleadores` (sin autogoles). */
export function useGoleadores(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['goleadores', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goleadores')
        .select('*')
        .eq('categoria_id', categoriaId ?? 0)
        .order('goles', { ascending: false })
        .order('jugador')
      if (error) throw error
      return data
    },
    enabled: categoriaId !== undefined,
  })
}

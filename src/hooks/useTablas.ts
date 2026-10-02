import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/** Vista `posiciones`: la base ya calcula y ordena (`posicion`) con los criterios de desempate. */
export function usePosiciones(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['posiciones', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posiciones')
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

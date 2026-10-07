import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

async function obtenerTorneoActivo() {
  const { data, error } = await supabase
    .from('torneos')
    .select('*, canchas(*), categorias(*)')
    .eq('activo', true)
    .order('orden', { referencedTable: 'canchas' })
    .order('orden', { referencedTable: 'categorias' })
    .maybeSingle()
  if (error) throw error
  return data
}

export function useTorneoActivo() {
  return useQuery({
    queryKey: ['torneo-activo'],
    queryFn: obtenerTorneoActivo,
  })
}

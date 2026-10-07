import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useEquipos(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['equipos', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select('id, nombre, representante, escudo_path, grupo:grupos(id, nombre)')
        .eq('categoria_id', categoriaId ?? 0)
        .order('nombre')
      if (error) throw error
      return data
    },
    enabled: categoriaId !== undefined,
  })
}

async function obtenerEquipo(id: number) {
  const { data, error } = await supabase
    .from('equipos')
    .select(
      `id, nombre, representante, escudo_path,
      grupo:grupos(id, nombre),
      categoria:categorias(id, nombre),
      jugadores(id, nombre, numero, posicion)`,
    )
    .eq('id', id)
    .order('numero', { referencedTable: 'jugadores', nullsFirst: false })
    .maybeSingle()
  if (error) throw error
  return data
}

export type EquipoDetalle = NonNullable<Awaited<ReturnType<typeof obtenerEquipo>>>

export function useEquipo(id: number) {
  return useQuery({
    queryKey: ['equipo', id],
    queryFn: () => obtenerEquipo(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

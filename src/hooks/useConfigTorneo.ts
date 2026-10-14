import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mensajeError } from '@/lib/errores'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type DatosTorneo = Pick<
  Database['public']['Tables']['torneos']['Insert'],
  'nombre' | 'tipo' | 'fecha_inicio' | 'fecha_fin' | 'hora_inicio_jornada' | 'hora_fin_jornada' | 'minutos_entre_partidos'
>

/** Lo que se pierde al borrar un torneo (para la confirmación fuerte). */
export function useConteoTorneo(torneoId: number | undefined) {
  return useQuery({
    queryKey: ['conteo-torneo', torneoId],
    queryFn: async () => {
      const id = torneoId ?? 0
      const contar = async (consulta: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
        const { count, error } = await consulta
        if (error) throw new Error(error.message)
        return count ?? 0
      }
      const [canchas, categorias, equipos, partidos] = await Promise.all([
        contar(supabase.from('canchas').select('id', { count: 'exact', head: true }).eq('torneo_id', id)),
        contar(supabase.from('categorias').select('id', { count: 'exact', head: true }).eq('torneo_id', id)),
        contar(
          supabase
            .from('equipos')
            .select('id, categorias!inner(torneo_id)', { count: 'exact', head: true })
            .eq('categorias.torneo_id', id),
        ),
        contar(
          supabase
            .from('partidos')
            .select('id, categorias!inner(torneo_id)', { count: 'exact', head: true })
            .eq('categorias.torneo_id', id),
        ),
      ])
      return { canchas, categorias, equipos, partidos }
    },
    enabled: torneoId !== undefined,
    // Siempre fresco: lo que se borraría tiene que ser exacto.
    staleTime: 0,
  })
}

/** Crear, editar, activar y borrar torneos (super admin; RLS y la RPC lo validan en la base). */
export function useMutacionesTorneo() {
  const queryClient = useQueryClient()
  const refrescar = () => {
    void queryClient.invalidateQueries({ queryKey: ['torneos'] })
    void queryClient.invalidateQueries({ queryKey: ['torneo-activo'] })
    void queryClient.invalidateQueries({ queryKey: ['partidos'] })
  }
  const opciones = {
    onSuccess: refrescar,
    onError: (error: unknown) => {
      toast.error(mensajeError(error))
    },
  }

  const crear = useMutation({
    // Siempre inactivo: la columna es `true` por defecto y solo puede haber uno activo.
    mutationFn: async (datos: DatosTorneo) => {
      const { data, error } = await supabase
        .from('torneos')
        .insert({ ...datos, activo: false })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    },
    ...opciones,
  })
  const editar = useMutation({
    mutationFn: async ({ id, datos }: { id: number; datos: DatosTorneo }) => {
      const { error } = await supabase.from('torneos').update(datos).eq('id', id)
      if (error) throw error
    },
    ...opciones,
  })
  const activar = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.rpc('activar_torneo', { p_id: id })
      if (error) throw error
    },
    ...opciones,
  })
  const borrar = useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase.from('torneos').delete().eq('id', id).select('id')
      if (error) throw error
      if (data.length === 0) throw new Error('No se pudo borrar el torneo (no existe o no tienes permiso).')
    },
    ...opciones,
  })

  return { crear, editar, activar, borrar, ocupado: crear.isPending || editar.isPending || activar.isPending || borrar.isPending }
}

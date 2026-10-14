import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { prepararEscudo, slugArchivo } from '@/lib/escudo-imagen'
import { supabase } from '@/lib/supabase'

const CLAVES = ['equipos-config', 'equipo-config', 'equipos', 'equipo', 'categorias-config', 'partidos', 'posiciones', 'goleadores']
const BUCKET = 'escudos'

export function useEquiposConfig(categoriaId: number | undefined) {
  return useQuery({
    queryKey: ['equipos-config', categoriaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipos')
        .select('id, nombre, representante, escudo_path, grupo:grupos(nombre), jugadores(id)')
        .eq('categoria_id', categoriaId ?? 0)
        .order('nombre')
      if (error) throw error
      return data.map(({ jugadores, ...e }) => ({ ...e, jugadores: jugadores.length }))
    },
    enabled: categoriaId !== undefined,
  })
}

async function obtenerEquipo(id: number) {
  const { data, error } = await supabase
    .from('equipos')
    .select(
      'id, nombre, representante, escudo_path, categoria_id, categoria:categorias(id, nombre, torneo_id), grupo:grupos(nombre), jugadores(id, nombre, numero, posicion)',
    )
    .eq('id', id)
    .order('numero', { referencedTable: 'jugadores', nullsFirst: false })
    .order('nombre', { referencedTable: 'jugadores' })
    .maybeSingle()
  if (error) throw error
  return data
}

export type EquipoConfig = NonNullable<Awaited<ReturnType<typeof obtenerEquipo>>>
export type JugadorConfig = EquipoConfig['jugadores'][number]

export function useEquipoConfig(id: number) {
  return useQuery({
    queryKey: ['equipo-config', id],
    queryFn: () => obtenerEquipo(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Lo que se pierde al borrar un equipo: partidos ya jugados y goles a su favor. */
export function useImpactoEquipo(id: number | undefined) {
  return useQuery({
    queryKey: ['impacto-equipo', id],
    queryFn: async () => {
      const equipo = id ?? 0
      const [partidos, goles] = await Promise.all([
        supabase
          .from('partidos')
          .select('id', { count: 'exact', head: true })
          .or(`equipo_local_id.eq.${String(equipo)},equipo_visitante_id.eq.${String(equipo)}`)
          .neq('estado', 'programado'),
        supabase.from('eventos').select('id', { count: 'exact', head: true })
          .eq('equipo_id', equipo)
          .eq('tipo', 'gol'),
      ])
      if (partidos.error) throw partidos.error
      if (goles.error) throw goles.error
      return { partidosJugados: partidos.count ?? 0, goles: goles.count ?? 0 }
    },
    enabled: id !== undefined,
    staleTime: 0,
  })
}

export interface DatosEquipo {
  nombre: string
  representante: string | null
}

export interface DatosJugador {
  nombre: string
  numero: number | null
}

/** Borra un archivo del bucket sin frenar la acción principal si falla (queda huérfano, no rompe nada). */
async function borrarArchivo(path: string | null) {
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

export function useMutacionesEquipos() {
  const crearEquipo = useMutacionConfig(async ({ categoriaId, datos }: { categoriaId: number; datos: DatosEquipo }) => {
    const { data, error } = await supabase
      .from('equipos')
      .insert({ ...datos, categoria_id: categoriaId })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }, CLAVES)

  const editarEquipo = useMutacionConfig(async ({ id, datos }: { id: number; datos: DatosEquipo }) => {
    const { error } = await supabase.from('equipos').update(datos).eq('id', id)
    if (error) throw error
  }, CLAVES)

  const borrarEquipo = useMutacionConfig(async (equipo: { id: number; escudo_path: string | null }) => {
    const { data, error } = await supabase.from('equipos').delete().eq('id', equipo.id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar el equipo (no existe o no tienes permiso).')
    await borrarArchivo(equipo.escudo_path)
  }, CLAVES)

  /** Sube el escudo ya convertido a WebP y reemplaza el anterior (§3.6). */
  const subirEscudo = useMutacionConfig(
    async ({ equipo, archivo }: { equipo: EquipoConfig; archivo: File }) => {
      const imagen = await prepararEscudo(archivo)
      // Nombre único: el navegador no muestra la versión vieja guardada en caché.
      const path = `${String(equipo.categoria.torneo_id)}/${slugArchivo(equipo.categoria.nombre)}/${slugArchivo(equipo.nombre)}-${String(equipo.id)}-${String(Date.now())}.webp`
      const { error: errorSubida } = await supabase.storage
        .from(BUCKET)
        .upload(path, imagen, { contentType: 'image/webp', upsert: false })
      if (errorSubida) throw errorSubida
      const { error } = await supabase.from('equipos').update({ escudo_path: path }).eq('id', equipo.id)
      if (error) {
        await borrarArchivo(path)
        throw error
      }
      await borrarArchivo(equipo.escudo_path)
    },
    CLAVES,
  )

  const quitarEscudo = useMutacionConfig(async (equipo: { id: number; escudo_path: string | null }) => {
    const { error } = await supabase.from('equipos').update({ escudo_path: null }).eq('id', equipo.id)
    if (error) throw error
    await borrarArchivo(equipo.escudo_path)
  }, CLAVES)

  const crearJugador = useMutacionConfig(async ({ equipoId, datos }: { equipoId: number; datos: DatosJugador }) => {
    const { error } = await supabase.from('jugadores').insert({ ...datos, equipo_id: equipoId })
    if (error) throw error
  }, CLAVES)

  const editarJugador = useMutacionConfig(async ({ id, datos }: { id: number; datos: DatosJugador }) => {
    const { error } = await supabase.from('jugadores').update(datos).eq('id', id)
    if (error) throw error
  }, CLAVES)

  const borrarJugador = useMutacionConfig(async (id: number) => {
    const { data, error } = await supabase.from('jugadores').delete().eq('id', id).select('id')
    if (error) throw error
    if (data.length === 0) throw new Error('No se pudo borrar el jugador.')
  }, CLAVES)

  return {
    crearEquipo,
    editarEquipo,
    borrarEquipo,
    subirEscudo,
    quitarEscudo,
    crearJugador,
    editarJugador,
    borrarJugador,
  }
}

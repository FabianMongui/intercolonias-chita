import { useQuery } from '@tanstack/react-query'
import { useMutacionConfig } from '@/hooks/useMutacionConfig'
import { prepararEscudo, slugArchivo } from '@/lib/escudo-imagen'
import { supabase } from '@/lib/supabase'

const CLAVES = ['clubes-config', 'equipos-config', 'equipo-config', 'equipos', 'equipo', 'historial-config', 'historial']
const BUCKET = 'escudos'
/** Los escudos de club viven en esta carpeta; los equipos pueden apuntar a ellos sin ser dueños del archivo. */
export const CARPETA_CLUBES = 'clubes/'

async function obtenerClubes() {
  const { data, error } = await supabase.from('clubes').select('id, nombre, escudo_path, equipos(id)').order('nombre')
  if (error) throw error
  return data.map(({ equipos, ...c }) => ({ ...c, equipos: equipos.length }))
}

export type ClubConfig = Awaited<ReturnType<typeof obtenerClubes>>[number]

export function useClubes() {
  return useQuery({ queryKey: ['clubes-config'], queryFn: obtenerClubes })
}

const sinTildes = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/**
 * Sugerencia de club para un equipo por su nombre ("Chita 2 FC" → "Colonia Chitana"): alguna palabra del
 * equipo (4+ letras) es el comienzo del nombre del club sin "Colonia", o al revés. Solo sugiere; el usuario elige.
 */
export function sugerirClub<C extends { id: number; nombre: string }>(nombreEquipo: string, clubes: C[]): C | undefined {
  const palabras = sinTildes(nombreEquipo)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 4)
  return clubes.find((c) => {
    const clave = sinTildes(c.nombre).replace(/^colonia\s+/, '').split(/\s+/)[0] ?? ''
    return clave.length >= 4 && palabras.some((p) => clave.startsWith(p) || p.startsWith(clave))
  })
}

async function borrarArchivo(path: string | null) {
  if (path) await supabase.storage.from(BUCKET).remove([path])
}

export function useMutacionesClubes() {
  const crear = useMutacionConfig(async (nombre: string) => {
    const { data, error } = await supabase.from('clubes').insert({ nombre }).select('id').single()
    if (error) throw error
    return data.id
  }, CLAVES)

  const renombrar = useMutacionConfig(async ({ id, nombre }: { id: number; nombre: string }) => {
    const { error } = await supabase.from('clubes').update({ nombre }).eq('id', id)
    if (error) throw error
  }, CLAVES)

  /** Los equipos del club quedan sin club; si tiene títulos cargados la base no deja borrarlo. */
  const borrar = useMutacionConfig(async (club: { id: number; escudo_path: string | null }) => {
    const { data, error } = await supabase.from('clubes').delete().eq('id', club.id).select('id')
    if (error) {
      if (error.code === '23503') throw new Error('Este club tiene títulos en el historial: bórralos primero.')
      throw error
    }
    if (data.length === 0) throw new Error('No se pudo borrar el club.')
    // Los equipos que usaban este escudo lo pierden: se les quita la referencia antes de borrar el archivo.
    if (club.escudo_path) {
      const { error: errorEquipos } = await supabase.from('equipos').update({ escudo_path: null }).eq('escudo_path', club.escudo_path)
      // Si no se pudo soltar la referencia, el archivo se deja (huérfano) para no romper escudos.
      if (!errorEquipos) await borrarArchivo(club.escudo_path)
    }
  }, CLAVES)

  /** WebP de 256 px como los de equipo; los equipos que mostraban el escudo viejo del club pasan al nuevo. */
  const subirEscudo = useMutacionConfig(async ({ club, archivo }: { club: ClubConfig; archivo: File }) => {
    const imagen = await prepararEscudo(archivo)
    const path = `${CARPETA_CLUBES}${slugArchivo(club.nombre)}-${String(club.id)}-${String(Date.now())}.webp`
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(path, imagen, { contentType: 'image/webp', upsert: false })
    if (errorSubida) throw errorSubida
    const { error } = await supabase.from('clubes').update({ escudo_path: path }).eq('id', club.id)
    if (error) {
      await borrarArchivo(path)
      throw error
    }
    if (club.escudo_path) {
      const { error: errorEquipos } = await supabase.from('equipos').update({ escudo_path: path }).eq('escudo_path', club.escudo_path)
      // Sin pasar los equipos al escudo nuevo, el viejo no se borra (seguirían apuntando a él).
      if (errorEquipos) throw new Error('El escudo del club cambió, pero algunos equipos siguen con el anterior. Intenta de nuevo.')
      await borrarArchivo(club.escudo_path)
    }
  }, CLAVES)

  return { crear, renombrar, borrar, subirEscudo }
}

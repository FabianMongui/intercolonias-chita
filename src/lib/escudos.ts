import { supabase } from '@/lib/supabase'

/** URL pública del escudo guardado en el bucket `escudos`, o null si el equipo no tiene. */
export function urlEscudo(path: string | null | undefined): string | null {
  if (!path) return null
  return supabase.storage.from('escudos').getPublicUrl(path).data.publicUrl
}

/** Iniciales para el escudo de respaldo: "Chita FC" → "CF", "Bogotá" → "BO". */
export function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return (palabras[0] ?? '').slice(0, 2).toUpperCase()
  return palabras
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
}

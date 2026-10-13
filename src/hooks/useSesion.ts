import type { Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'

interface EstadoSesion {
  cargando: boolean
  sesion: Session | null
}

// Un solo suscriptor a Supabase Auth para toda la app; los componentes leen este estado.
let estado: EstadoSesion = { cargando: true, sesion: null }
const oyentes = new Set<() => void>()
let iniciado = false

function iniciar() {
  if (iniciado) return
  iniciado = true
  // Emite INITIAL_SESSION al suscribirse (sesión guardada en el navegador) y luego cada cambio.
  supabase.auth.onAuthStateChange((_evento, sesion) => {
    estado = { cargando: false, sesion }
    for (const oyente of oyentes) oyente()
  })
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** Sesión actual de Supabase Auth (`cargando` hasta leer la guardada en el navegador). */
export function useSesion(): EstadoSesion {
  iniciar()
  return useSyncExternalStore(suscribir, () => estado)
}

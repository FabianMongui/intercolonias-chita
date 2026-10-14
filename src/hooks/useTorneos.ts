import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Todos los torneos (el super admin prepara el próximo mientras otro está activo). */
export function useTorneos() {
  return useQuery({
    queryKey: ['torneos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('torneos')
        .select('*')
        .order('fecha_inicio', { ascending: false })
        .order('id', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

const CLAVE = 'torneo-en-edicion'

function leer(): number | null {
  try {
    const valor = Number(localStorage.getItem(CLAVE))
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

/**
 * Torneo que se está configurando. Se recuerda en este navegador (comodidad del super admin);
 * si no hay uno guardado o ya no existe, se usa el activo.
 */
export function useTorneoEnEdicion() {
  const torneosQ = useTorneos()
  const [elegido, setElegido] = useState<number | null>(leer)
  const torneos = torneosQ.data ?? []
  const torneo = torneos.find((t) => t.id === elegido) ?? torneos.find((t) => t.activo) ?? torneos[0]

  const elegir = useCallback((id: number) => {
    setElegido(id)
    try {
      localStorage.setItem(CLAVE, String(id))
    } catch {
      // Sin almacenamiento (modo privado): se recuerda solo mientras la página está abierta.
    }
  }, [])

  return { torneosQ, torneos, torneo, elegir }
}

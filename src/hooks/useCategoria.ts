import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'

/** "Única" → "unica", "Veteranos F11" → "veteranos-f11". Para `?cat=` legible y compartible. */
export function slugCategoria(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Categoría elegida, guardada en `?cat=` para que los links se puedan compartir (§4.1). */
export function useCategoria() {
  const { data: torneo } = useTorneoActivo()
  const [params, setParams] = useSearchParams()
  const categorias = useMemo(() => torneo?.categorias ?? [], [torneo])
  const slug = params.get('cat')

  const categoria = categorias.find((c) => slugCategoria(c.nombre) === slug) ?? categorias[0]

  const elegir = useCallback(
    (id: number) => {
      const nueva = categorias.find((c) => c.id === id)
      if (!nueva) return
      setParams(
        (prev) => {
          const siguiente = new URLSearchParams(prev)
          siguiente.set('cat', slugCategoria(nueva.nombre))
          return siguiente
        },
        { replace: true },
      )
    },
    [categorias, setParams],
  )

  return { categorias, categoria, elegir }
}

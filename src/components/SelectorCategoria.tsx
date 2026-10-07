import { ChipFiltro } from '@/components/ChipFiltro'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoria } from '@/hooks/useCategoria'
import { useTorneoActivo } from '@/hooks/useTorneoActivo'

/** Selector de categoría (Única / Veteranos / Femenino…). La elección vive en `?cat=`. */
export function SelectorCategoria() {
  const { isPending } = useTorneoActivo()
  const { categorias, categoria, elegir } = useCategoria()
  // Mientras llega el torneo se reserva el alto de los chips para que nada salte (CLS).
  if (isPending) return <Skeleton className="h-11 w-64 rounded-full" />
  if (categorias.length < 2) return null

  return (
    <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
      {categorias.map((c) => (
        <ChipFiltro
          key={c.id}
          activo={c.id === categoria?.id}
          onClick={() => {
            elegir(c.id)
          }}
        >
          {c.nombre}
        </ChipFiltro>
      ))}
    </div>
  )
}

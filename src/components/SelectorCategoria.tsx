import { ChipFiltro } from '@/components/ChipFiltro'
import { useCategoria } from '@/hooks/useCategoria'

/** Selector de categoría (Única / Veteranos / Femenino…). La elección vive en `?cat=`. */
export function SelectorCategoria() {
  const { categorias, categoria, elegir } = useCategoria()
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

import { useId } from 'react'

/** Selector de categoría de las pantallas de configuración (la elegida va en la URL, ?cat=<id>). */
export function SelectorCategoria({
  categorias,
  categoria,
  cambiar,
}: {
  categorias: { id: number; nombre: string }[]
  categoria: { id: number } | undefined
  cambiar: (id: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        Categoría
      </label>
      <select
        id={id}
        value={categoria ? String(categoria.id) : ''}
        onChange={(e) => {
          cambiar(e.target.value)
        }}
        className="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-base font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:max-w-xs"
      >
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </div>
  )
}

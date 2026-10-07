import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import type { Database } from '@/types/database'

type Cancha = Pick<Database['public']['Tables']['canchas']['Row'], 'id' | 'nombre' | 'tipo' | 'activa'>

/** Lista desplegable nativa (cómoda en el celular) para filtrar por cancha. `undefined` = todas. */
export function SelectorCancha({
  canchas,
  valor,
  onCambio,
}: {
  canchas: Cancha[]
  valor: number | undefined
  onCambio: (id: number | undefined) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="shrink-0 text-sm font-semibold text-muted-foreground">
        Cancha
      </label>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <select
          id={id}
          value={valor ?? ''}
          onChange={(e) => {
            onCambio(e.target.value === '' ? undefined : Number(e.target.value))
          }}
          className="min-h-11 w-full appearance-none rounded-lg border border-input bg-surface py-2 pr-10 pl-3 font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="">Todas las canchas</option>
          {canchas.map((c) => (
            <option key={c.id} value={c.id}>
              {`${c.nombre} (${c.tipo})${c.activa ? '' : ' · cerrada'}`}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  )
}

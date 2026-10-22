import { Trophy } from 'lucide-react'
import { useState } from 'react'
import { ErrorDatos } from '@/components/EstadosPagina'
import { Estrellas } from '@/components/Estrellas'
import { Escudo } from '@/components/partido/Escudo'
import { Skeleton } from '@/components/ui/skeleton'
import { type FilaPalmares, useHistorial } from '@/hooks/useHistorial'
import { cn } from '@/lib/utils'

const plural = (n: number, uno: string, varios: string) => `${String(n)} ${n === 1 ? uno : varios}`

/** Historial (§ mejoras fase 6): ranking de títulos por club y campeones por año y categoría. */
export default function Historial() {
  const historialQ = useHistorial()
  const [categoria, setCategoria] = useState<string | null>(null)

  if (historialQ.isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando historial">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>
    )
  }
  if (historialQ.isError) {
    return <ErrorDatos reintentar={() => void historialQ.refetch()} reintentando={historialQ.isRefetching} />
  }

  const { palmares, ranking } = historialQ.data
  const categorias = [...new Set(palmares.map((p) => p.categoria ?? ''))].filter(Boolean)
  const elegida = categoria !== null && categorias.includes(categoria) ? categoria : (categorias[0] ?? null)
  const porAnio = palmares.filter((p) => p.categoria === elegida)

  return (
    <div className="flex flex-col gap-6">
      <title>Historial · Intercolonias Chita</title>
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Historial</h1>
        <p className="text-muted-foreground">Campeones de los torneos de colonias.</p>
      </div>

      {palmares.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-surface p-4 text-muted-foreground">
          Todavía no hay campeones registrados.
        </p>
      ) : (
        <>
          <section aria-labelledby="titulo-titulos" className="flex flex-col gap-2">
            <h2 id="titulo-titulos" className="text-2xl">
              Títulos
            </h2>
            <ol className="flex flex-col divide-y rounded-lg border bg-card">
              {ranking.map((r) => (
                <li key={r.club_id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                  <Escudo nombre={r.nombre ?? ''} path={r.escudo_path} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{r.nombre}</span>
                  <Estrellas titulos={r.titulos ?? 0} />
                  <span className="w-6 text-right font-display text-2xl tabular-nums" aria-hidden>
                    {r.titulos}
                  </span>
                  <span className="sr-only">{plural(r.titulos ?? 0, 'título', 'títulos')}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="titulo-por-anio" className="flex flex-col gap-3">
            <h2 id="titulo-por-anio" className="text-2xl">
              Por año
            </h2>
            {categorias.length > 1 && (
              <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={c === elegida}
                    onClick={() => {
                      setCategoria(c)
                    }}
                    className={cn(
                      'min-h-11 rounded-full border px-4 font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
                      c === elegida ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {porAnio.map((p) => (
                <TarjetaCampeon key={`${p.origen ?? ''}-${String(p.anio)}-${p.tipo_torneo ?? ''}-${p.categoria ?? ''}`} p={p} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

function TarjetaCampeon({ p }: { p: FilaPalmares }) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-2xl leading-none tabular-nums">{p.anio}</span>
        {p.tipo_torneo && p.tipo_torneo !== 'intercolonias' && (
          <span className="text-sm text-muted-foreground capitalize">{p.tipo_torneo}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Trophy aria-hidden className="size-5 shrink-0 text-gold" />
        <Escudo nombre={p.campeon_nombre ?? ''} path={p.campeon_escudo_path} />
        <span className="min-w-0 flex-1 font-semibold break-words">
          <span className="sr-only">Campeón: </span>
          {p.campeon_nombre}
        </span>
      </div>
      {(p.marcador_final ?? p.subcampeon_nombre) && (
        <p className="text-sm text-muted-foreground">
          {[p.marcador_final ? `Final ${p.marcador_final}` : null, p.subcampeon_nombre ? `Subcampeón: ${p.subcampeon_nombre}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </li>
  )
}

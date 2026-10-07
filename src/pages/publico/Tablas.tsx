import { useState } from 'react'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { Goleadores, GoleadoresSkeleton } from '@/components/tablas/Goleadores'
import { Llaves } from '@/components/tablas/Llaves'
import { TablaPosiciones, TablaPosicionesSkeleton } from '@/components/tablas/TablaPosiciones'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoria } from '@/hooks/useCategoria'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { useGoleadores, usePosiciones } from '@/hooks/useTablas'
import { agrupar } from '@/lib/agrupar'

const FASES_ELIMINATORIA = new Set(['semifinal', 'tercer_puesto', 'final'])
const GOLEADORES_INICIALES = 10

export default function Tablas() {
  const datos = usePartidosTorneo()
  const { categoria } = useCategoria()
  const posicionesQ = usePosiciones(categoria?.id)
  const goleadoresQ = useGoleadores(categoria?.id)
  const [todosGoleadores, setTodosGoleadores] = useState(false)

  if (datos.error) return <ErrorDatos reintentar={datos.reintentar} reintentando={datos.reintentando} />
  if (!datos.cargando && !datos.torneo) return <SinTorneo />

  const eliminatoria = datos.partidos.filter(
    (p) => p.categoria_id === categoria?.id && FASES_ELIMINATORIA.has(p.fase),
  )
  const goleadores = goleadoresQ.data ?? []
  const goleadoresVisibles = todosGoleadores ? goleadores : goleadores.slice(0, GOLEADORES_INICIALES)

  return (
    <div className="flex flex-col gap-8">
      <title>Tablas · Intercolonias Chita</title>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl">Tablas</h1>
        <SelectorCategoria />
      </div>

      <section aria-labelledby="titulo-posiciones" className="flex flex-col gap-4">
        <h2 id="titulo-posiciones" className="text-3xl">
          Posiciones
        </h2>
        {posicionesQ.isLoading ? (
          <div className="grid gap-4">
            <TablaPosicionesSkeleton />
            <TablaPosicionesSkeleton />
          </div>
        ) : posicionesQ.isError ? (
          <ErrorDatos
            nivel="h3"
            mensaje="No pudimos cargar las posiciones"
            reintentar={() => void posicionesQ.refetch()}
            reintentando={posicionesQ.isRefetching}
          />
        ) : !posicionesQ.data || posicionesQ.data.length === 0 ? (
          <Vacio>Esta categoría aún no tiene grupos armados.</Vacio>
        ) : (
          <div className="grid gap-4">
            {agrupar(posicionesQ.data, (f) => f.grupo ?? '?').map(([grupo, filas]) => (
              <TablaPosiciones key={grupo} grupo={grupo} filas={filas} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-llaves" className="flex flex-col gap-4">
        <h2 id="titulo-llaves" className="text-3xl">
          Llaves
        </h2>
        {datos.cargando ? (
          <Skeleton className="h-40" />
        ) : (
          <Llaves partidos={eliminatoria} etiquetaPartido={datos.etiquetaPartido} />
        )}
      </section>

      <section aria-labelledby="titulo-goleadores" className="flex flex-col gap-4">
        <h2 id="titulo-goleadores" className="text-3xl">
          Goleadores
        </h2>
        {goleadoresQ.isLoading ? (
          <GoleadoresSkeleton />
        ) : goleadoresQ.isError ? (
          <ErrorDatos
            nivel="h3"
            mensaje="No pudimos cargar los goleadores"
            reintentar={() => void goleadoresQ.refetch()}
            reintentando={goleadoresQ.isRefetching}
          />
        ) : (
          <>
            <Goleadores filas={goleadoresVisibles} />
            {goleadores.length > GOLEADORES_INICIALES && (
              <Button
                variant="outline"
                className="self-start"
                aria-expanded={todosGoleadores}
                onClick={() => {
                  setTodosGoleadores((v) => !v)
                }}
              >
                {todosGoleadores ? 'Ver menos' : `Ver todos (${String(goleadores.length)})`}
              </Button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

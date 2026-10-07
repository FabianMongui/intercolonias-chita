import { useSearchParams } from 'react-router'
import { ChipFiltro } from '@/components/ChipFiltro'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { SelectorCategoria } from '@/components/SelectorCategoria'
import { TarjetaPartido, TarjetaPartidoSkeleton } from '@/components/partido/TarjetaPartido'
import { useCategoria } from '@/hooks/useCategoria'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import { agrupar } from '@/lib/agrupar'
import { horaReferencia } from '@/lib/orden'
import { claveDia, formatearFechaLarga } from '@/lib/time'

const SIN_HORARIO = 'sin-horario'
const SIN_CANCHA = 'Sin cancha asignada'

export default function Partidos() {
  const datos = usePartidosTorneo()
  const { categoria } = useCategoria()
  const [params, setParams] = useSearchParams()
  const { torneo, partidos, desfaseMs, etiquetaPartido, minutosPorTiempo } = datos

  const canchas = torneo?.canchas ?? []
  const canchaParam = Number(params.get('cancha'))
  const canchaId = canchas.some((c) => c.id === canchaParam) ? canchaParam : undefined

  const elegirCancha = (id: number | undefined) => {
    setParams(
      (prev) => {
        const siguiente = new URLSearchParams(prev)
        if (id === undefined) siguiente.delete('cancha')
        else siguiente.set('cancha', String(id))
        return siguiente
      },
      { replace: true },
    )
  }

  if (datos.cargando) return <PartidosCargando />
  if (datos.error) return <ErrorDatos reintentar={datos.reintentar} reintentando={datos.reintentando} />
  if (!torneo) return <SinTorneo />

  const lista = partidos
    .filter((p) => p.categoria_id === categoria?.id)
    .filter((p) => canchaId === undefined || p.cancha_id === canchaId)
    .sort((a, b) => horaReferencia(a) - horaReferencia(b))

  // Día según la hora programada (la estimada puede moverse, el día de la agenda no).
  const porDia = agrupar(lista, (p) => (p.hora_programada ? claveDia(p.hora_programada) : SIN_HORARIO))

  return (
    <div className="flex flex-col gap-6">
      <title>Partidos · Intercolonias Chita</title>
      <h1 className="text-4xl">Partidos</h1>

      <div className="flex flex-col gap-3">
        <SelectorCategoria />
        {canchas.length > 1 && (
          <div role="group" aria-label="Cancha" className="flex flex-wrap gap-2">
            <ChipFiltro activo={canchaId === undefined} onClick={() => { elegirCancha(undefined) }}>
              Todas las canchas
            </ChipFiltro>
            {canchas.map((c) => (
              <ChipFiltro key={c.id} activo={canchaId === c.id} onClick={() => { elegirCancha(c.id) }}>
                {c.nombre}
                {!c.activa && ' (cerrada)'}
              </ChipFiltro>
            ))}
          </div>
        )}
      </div>

      {porDia.length === 0 ? (
        <Vacio>No hay partidos con estos filtros.</Vacio>
      ) : (
        porDia.map(([dia, delDia]) => {
          const idTitulo = `dia-${dia}`
          // Con "Todas las canchas" se separa por cancha dentro del día.
          const bloques =
            canchaId === undefined ? agrupar(delDia, (p) => p.cancha?.nombre ?? SIN_CANCHA) : [['', delDia] as const]
          return (
            <section key={dia} aria-labelledby={idTitulo} className="flex flex-col gap-4">
              <h2 id={idTitulo} className="text-3xl first-letter:uppercase">
                {dia === SIN_HORARIO ? 'Sin horario' : formatearFechaLarga(dia)}
              </h2>
              {bloques.map(([cancha, deCancha]) => (
                <div key={cancha || 'todas'} className="flex flex-col gap-2">
                  {cancha && <h3 className="text-xl">{cancha}</h3>}
                  <ul className="grid gap-3 md:grid-cols-2">
                    {deCancha.map((p) => (
                      <li key={p.id}>
                        <TarjetaPartido
                          partido={p}
                          etiquetaPartido={etiquetaPartido}
                          desfaseMs={desfaseMs}
                          minutosPorTiempo={minutosPorTiempo(p.categoria_id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )
        })
      )}
    </div>
  )
}

function PartidosCargando() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando partidos">
      <h1 className="text-4xl">Partidos</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <TarjetaPartidoSkeleton />
        <TarjetaPartidoSkeleton />
        <TarjetaPartidoSkeleton />
        <TarjetaPartidoSkeleton />
      </div>
    </div>
  )
}

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { ErrorDatos, SinTorneo, Vacio } from '@/components/EstadosPagina'
import { HoraOficial } from '@/components/HoraOficial'
import { SelectorCancha } from '@/components/SelectorCancha'
import { TarjetaPartido, TarjetaPartidoSkeleton } from '@/components/partido/TarjetaPartido'
import { Button } from '@/components/ui/button'
import type { Partido } from '@/hooks/usePartidos'
import { usePartidosTorneo } from '@/hooks/usePartidosTorneo'
import type { Perfil } from '@/hooks/usePerfil'
import { agrupar } from '@/lib/agrupar'
import { horaReferencia } from '@/lib/orden'
import { claveDia, formatearFechaLarga } from '@/lib/time'

const TODAS = 'todas'
const CUANTOS_PROXIMOS = 8
const CUANTOS_FINALIZADOS = 10

function horaFin(p: Partido): number {
  return p.fin_real ? Date.parse(p.fin_real) : 0
}

/**
 * Lista del admin de cancha (§4.2): partidos de una cancha (por defecto la sugerida en su perfil,
 * cambiable porque los admins rotan). En vivo arriba, luego los próximos y, plegados, los finalizados.
 */
export default function ControlPartidos() {
  const perfil = useOutletContext<Perfil>()
  const datos = usePartidosTorneo()
  const [params, setParams] = useSearchParams()
  const [todosProximos, setTodosProximos] = useState(false)
  const { torneo, partidos, desfaseMs, etiquetaPartido, minutosPorTiempo, nombreCategoria } = datos

  const canchas = torneo?.canchas ?? []
  const param = params.get('cancha')
  // Sin ?cancha= se usa la sugerida del perfil; ?cancha=todas muestra todas.
  // Un ?cancha= inválido vuelve a la del perfil.
  const deParam = canchas.find((c) => c.id === Number(param))
  const canchaId =
    param === TODAS ? undefined : (deParam ?? canchas.find((c) => c.id === perfil.cancha_id))?.id
  const lugar = canchaId === undefined ? 'en ninguna cancha' : 'en esta cancha'

  const elegirCancha = (id: number | undefined) => {
    setParams(
      (prev) => {
        const siguiente = new URLSearchParams(prev)
        siguiente.set('cancha', id === undefined ? TODAS : String(id))
        return siguiente
      },
      { replace: true },
    )
  }

  if (datos.error) return <ErrorDatos reintentar={datos.reintentar} reintentando={datos.reintentando} />
  if (!datos.cargando && !torneo) return <SinTorneo />

  const deCancha = partidos.filter((p) => canchaId === undefined || p.cancha_id === canchaId)
  const enVivo = deCancha.filter((p) => p.estado === 'en_vivo')
  const proximos = deCancha
    .filter((p) => p.estado === 'programado')
    .sort((a, b) => horaReferencia(a) - horaReferencia(b))
  const finalizados = deCancha
    .filter((p) => p.estado === 'finalizado')
    .sort((a, b) => horaFin(b) - horaFin(a))
    .slice(0, CUANTOS_FINALIZADOS)
  // Entre partidos (lo más común) se destaca el que sigue.
  const siguienteId = enVivo.length === 0 ? proximos[0]?.id : undefined

  const tarjeta = (p: Partido, destacado = false) => (
    <div className="flex flex-col gap-1">
      <span className="text-base font-semibold text-foreground">
        {nombreCategoria(p.categoria_id)}
        {canchaId === undefined && p.cancha && ` · ${p.cancha.nombre}`}
      </span>
      <TarjetaPartido
        partido={p}
        etiquetaPartido={etiquetaPartido}
        desfaseMs={desfaseMs}
        minutosPorTiempo={minutosPorTiempo(p.categoria_id)}
        destacado={destacado}
        destino={`/admin/partido/${String(p.id)}`}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <title>Control de partidos · Intercolonias Chita</title>
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl">Control de partidos</h1>
        <HoraOficial />
        {canchas.length > 0 && <SelectorCancha canchas={canchas} valor={canchaId} onCambio={elegirCancha} />}
      </div>

      {datos.cargando ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando partidos">
          <TarjetaPartidoSkeleton destacado />
          <TarjetaPartidoSkeleton />
        </div>
      ) : (
        <>
          <section aria-labelledby="titulo-vivo" className="flex flex-col gap-3">
            <h2 id="titulo-vivo" className="text-3xl">
              En vivo
            </h2>
            {enVivo.length === 0 ? (
              <Vacio>{`No hay partidos en juego ${lugar}.`}</Vacio>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {enVivo.map((p) => (
                  <li key={p.id}>{tarjeta(p, true)}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-proximos" className="flex flex-col gap-3">
            <h2 id="titulo-proximos" className="text-3xl">
              Próximos
            </h2>
            {proximos.length === 0 ? (
              <Vacio>{`No quedan partidos pendientes ${lugar}.`}</Vacio>
            ) : (
              <>
                {agrupar(todosProximos ? proximos : proximos.slice(0, CUANTOS_PROXIMOS), (p) =>
                  p.hora_programada ? claveDia(p.hora_programada) : '',
                ).map(([dia, delDia]) => (
                  <div key={dia || 'sin-horario'} className="flex flex-col gap-2">
                    <h3 className="text-xl first-letter:uppercase">{dia ? formatearFechaLarga(dia) : 'Sin horario'}</h3>
                    <ul className="grid gap-3 md:grid-cols-2">
                      {delDia.map((p) => (
                        <li key={p.id}>{tarjeta(p, p.id === siguienteId)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {proximos.length > CUANTOS_PROXIMOS && (
                  <Button
                    variant="outline"
                    className="self-start"
                    aria-expanded={todosProximos}
                    onClick={() => {
                      setTodosProximos((v) => !v)
                    }}
                  >
                    {todosProximos ? 'Ver menos' : `Ver todos (${String(proximos.length)})`}
                  </Button>
                )}
              </>
            )}
          </section>

          <details className="group flex flex-col gap-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden rounded-md font-display text-3xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Últimos finalizados
              <ChevronDown
                aria-hidden
                className="ml-auto size-6 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            {finalizados.length === 0 ? (
              <Vacio>{`Todavía no hay partidos finalizados ${lugar}.`}</Vacio>
            ) : (
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {finalizados.map((p) => (
                  <li key={p.id}>{tarjeta(p)}</li>
                ))}
              </ul>
            )}
          </details>
        </>
      )}
    </div>
  )
}

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Escudo } from '@/components/partido/Escudo'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

export type PosicionRow = Database['public']['Views']['posiciones']['Row']

interface TablaPosicionesProps {
  /** Nombre del grupo tal cual viene de la vista ("A"); se muestra "Grupo A". */
  grupo: string
  filas: PosicionRow[]
}

const n = (valor: number | null) => valor ?? 0
const conSigno = (valor: number) => (valor > 0 ? `+${String(valor)}` : String(valor))

// Columnas que en móvil van en el detalle desplegable.
const DETALLE = [
  { clave: 'pg', corto: 'PG', largo: 'Partidos ganados' },
  { clave: 'pe', corto: 'PE', largo: 'Partidos empatados' },
  { clave: 'pp', corto: 'PP', largo: 'Partidos perdidos' },
  { clave: 'gf', corto: 'GF', largo: 'Goles a favor' },
  { clave: 'gc', corto: 'GC', largo: 'Goles en contra' },
] as const

const TH = 'px-1 py-2 text-center text-xs font-bold tracking-wide text-muted-foreground uppercase'
const TD = 'px-1 py-1 text-center tabular-nums'

/**
 * Posiciones de un grupo, en el orden que da la base (`posicion`).
 * Móvil: Pos, Equipo, PJ, DG, PTS + detalle desplegable. Desde md: todas las columnas.
 */
export function TablaPosiciones({ grupo, filas }: TablaPosicionesProps) {
  if (filas.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border bg-card">
        <h3 className="border-b bg-brand px-4 py-2 text-2xl text-brand-foreground">Grupo {grupo}</h3>
        <p className="px-4 py-6 text-center text-muted-foreground">Aún no hay equipos en este grupo</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full table-fixed border-collapse text-sm md:text-base">
        <caption className="border-b bg-brand px-4 py-2 text-left font-display text-2xl text-brand-foreground">
          Grupo {grupo}
        </caption>
        <thead className="border-b bg-muted">
          <tr>
            <th scope="col" className={cn(TH, 'w-9')}>
              <abbr title="Posición" className="no-underline">
                Pos
              </abbr>
            </th>
            <th scope="col" className={cn(TH, 'text-left')}>
              Equipo
            </th>
            <th scope="col" className={cn(TH, 'w-9 md:w-11')}>
              <abbr title="Partidos jugados" className="no-underline">
                PJ
              </abbr>
            </th>
            {DETALLE.map((d) => (
              <th key={d.clave} scope="col" className={cn(TH, 'hidden w-11 md:table-cell')}>
                <abbr title={d.largo} className="no-underline">
                  {d.corto}
                </abbr>
              </th>
            ))}
            <th scope="col" className={cn(TH, 'w-10 md:w-12')}>
              <abbr title="Diferencia de gol" className="no-underline">
                DG
              </abbr>
            </th>
            <th scope="col" className={cn(TH, 'w-11 md:w-14')}>
              <abbr title="Puntos" className="no-underline">
                PTS
              </abbr>
            </th>
            <th scope="col" className={cn(TH, 'w-12 md:hidden')}>
              <span className="sr-only">Detalle</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <Fila key={fila.equipo_id ?? `fila-${String(i)}`} fila={fila} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Fila({ fila }: { fila: PosicionRow }) {
  const [abierta, setAbierta] = useState(false)
  const idDetalle = useId()
  const nombre = fila.equipo ?? 'Equipo'

  return (
    <>
      <tr className={cn('border-b last:border-b-0', abierta && 'border-b-0 max-md:bg-muted/60')}>
        <td className={cn(TD, 'font-semibold')}>{fila.posicion ?? '–'}</td>
        <th scope="row" className="px-1 py-1 text-left font-semibold">
          <span className="flex min-h-11 items-center gap-2">
            <Escudo nombre={nombre} path={fila.escudo_path} tamano="sm" />
            <span className="min-w-0 leading-tight [overflow-wrap:anywhere]">{nombre}</span>
          </span>
        </th>
        <td className={TD}>{n(fila.pj)}</td>
        {DETALLE.map((d) => (
          <td key={d.clave} className={cn(TD, 'hidden md:table-cell')}>
            {n(fila[d.clave])}
          </td>
        ))}
        <td className={TD}>{conSigno(n(fila.dg))}</td>
        <td className={cn(TD, 'font-display text-xl leading-none')}>{n(fila.puntos)}</td>
        <td className="px-0.5 py-1 text-center md:hidden">
          <button
            type="button"
            aria-expanded={abierta}
            aria-controls={idDetalle}
            onClick={() => {
              setAbierta((a) => !a)
            }}
            className="inline-flex size-11 items-center justify-center rounded-md text-primary transition-colors hover:bg-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ChevronDown
              aria-hidden
              className={cn(
                'size-5 transition-transform duration-(--duracion-base)',
                abierta && 'rotate-180',
              )}
            />
            <span className="sr-only">
              {abierta ? 'Ocultar' : 'Ver'} detalle de {nombre}
            </span>
          </button>
        </td>
      </tr>
      <tr id={idDetalle} hidden={!abierta} className="border-b bg-muted/60 last:border-b-0 md:hidden">
        {/* 6 = columnas visibles en móvil; un colSpan mayor crea columnas fantasma en table-fixed. */}
        <td colSpan={6} className="px-3 pt-0 pb-3">
          <dl className="grid grid-cols-5 gap-1 text-center">
            {DETALLE.map((d) => (
              <div key={d.clave} className="flex flex-col rounded-md bg-card py-1.5">
                <dt className="text-xs font-bold text-muted-foreground">
                  <abbr title={d.largo} className="no-underline">
                    {d.corto}
                  </abbr>
                </dt>
                <dd className="font-semibold tabular-nums">{n(fila[d.clave])}</dd>
              </div>
            ))}
          </dl>
        </td>
      </tr>
    </>
  )
}

export function TablaPosicionesSkeleton({ filas = 3 }: { filas?: number }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-brand px-4 py-2">
        <Skeleton className="h-7 w-24 bg-brand-foreground/30" />
      </div>
      <div className="h-9 border-b bg-muted" />
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex h-[3.25rem] items-center gap-3 border-b px-2 last:border-b-0">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'
import { iniciales, urlEscudo } from '@/lib/escudos'
import { cn } from '@/lib/utils'

const TAMANOS = {
  sm: { px: 24, clase: 'size-6 text-sm' },
  md: { px: 40, clase: 'size-10 text-lg' },
  lg: { px: 64, clase: 'size-16 text-3xl' },
} as const

interface EscudoProps {
  nombre: string
  path: string | null
  tamano?: keyof typeof TAMANOS
  /**
   * true (por defecto) cuando el nombre del equipo ya se ve al lado: el escudo no se anuncia.
   * false si el escudo va solo: se anuncia como "Escudo de <nombre>".
   */
  decorativo?: boolean
  className?: string
}

/**
 * Escudo del equipo con tamaño fijo (sin CLS). Mientras carga, sin escudo o si falla: iniciales.
 * La imagen se superpone a las iniciales y solo se muestra cuando terminó de cargar.
 */
export function Escudo({ nombre, path, tamano = 'md', decorativo = true, className }: EscudoProps) {
  const url = urlEscudo(path)
  // Estado ligado a la URL: si cambia el path se vuelve a intentar sin un efecto.
  const [carga, setCarga] = useState<{ url: string; ok: boolean } | null>(null)
  const { px, clase } = TAMANOS[tamano]
  const etiqueta = `Escudo de ${nombre}`
  const estado = carga?.url === url ? carga : null
  const cargada = estado?.ok === true
  const fallida = estado?.ok === false

  return (
    <span
      {...(decorativo ? { 'aria-hidden': true } : { role: 'img', 'aria-label': etiqueta })}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold bg-surface-warm pt-[0.1em] font-display leading-none text-surface-warm-foreground select-none',
        cargada && 'border-transparent bg-surface',
        clase,
        className,
      )}
    >
      {!cargada && iniciales(nombre)}
      {url && !fallida && (
        <img
          src={url}
          width={px}
          height={px}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setCarga({ url, ok: true })
          }}
          onError={() => {
            setCarga({ url, ok: false })
          }}
          className={cn(
            'absolute inset-0 size-full object-contain transition-opacity duration-(--duracion-base)',
            cargada ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </span>
  )
}

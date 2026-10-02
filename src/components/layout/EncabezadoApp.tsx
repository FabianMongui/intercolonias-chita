import { Link } from 'react-router'
import { NavSuperior } from '@/components/layout/Navegacion'

export function EncabezadoApp() {
  return (
    <header className="bg-brand text-brand-foreground">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between gap-3 px-4 py-2">
        <Link
          to="/"
          className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-foreground"
        >
          <img
            src="/assets/Chita.png"
            alt=""
            width={40}
            height={40}
            fetchPriority="high"
            className="size-10 shrink-0 object-contain"
          />
          <span className="font-display text-3xl leading-none">Intercolonias Chita</span>
        </Link>
        <NavSuperior />
      </div>
    </header>
  )
}

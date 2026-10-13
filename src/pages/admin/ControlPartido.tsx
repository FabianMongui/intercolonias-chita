import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

// Paso 4 de la Fase 2: pantalla de control del partido. Por ahora solo permite volver a la lista.
export default function ControlPartido() {
  return (
    <section className="flex flex-col items-start gap-4">
      <title>Control de partido · Intercolonias Chita</title>
      <Link
        to="/admin"
        className="inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden className="size-5" />
        Control de partidos
      </Link>
      <h1 className="text-4xl">Control de partido</h1>
      <p className="text-muted-foreground">Esta pantalla llega en el siguiente paso.</p>
    </section>
  )
}

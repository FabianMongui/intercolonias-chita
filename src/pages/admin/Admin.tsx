import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Se carga en diferido. El login y el control de partido llegan en la Fase 2.
export default function Admin() {
  return (
    <section className="flex flex-col items-start gap-4">
      <title>Administración · Intercolonias Chita</title>
      <h1 className="text-4xl">Administración</h1>
      <p className="text-muted-foreground">El panel de administración estará disponible pronto.</p>
      <Button asChild variant="outline">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </section>
  )
}

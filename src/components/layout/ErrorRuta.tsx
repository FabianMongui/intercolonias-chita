import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { LayoutError } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'

/** Error dentro de una página: se pinta en el Layout, con el encabezado. */
export function ErrorRuta() {
  const error = useRouteError()
  const noEncontrada = isRouteErrorResponse(error) && error.status === 404
  const titulo = noEncontrada ? 'Página no encontrada' : 'Algo salió mal'

  return (
    <section className="flex flex-col items-start gap-4">
      <title>{`${titulo} · Intercolonias Chita`}</title>
      <h1 className="text-4xl">{titulo}</h1>
      <p className="text-muted-foreground">
        {noEncontrada
          ? 'La dirección que abriste no existe.'
          : 'No pudimos mostrar esta página. Intenta recargar.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {!noEncontrada && (
          <Button
            onClick={() => {
              window.location.reload()
            }}
          >
            Recargar
          </Button>
        )}
        <Button asChild variant={noEncontrada ? 'default' : 'outline'}>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </section>
  )
}

/** Error en la ruta raíz (p. ej. 404): agrega el encabezado porque el Layout no se montó. */
export function ErrorRaiz() {
  return (
    <LayoutError>
      <ErrorRuta />
    </LayoutError>
  )
}

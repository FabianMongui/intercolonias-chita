import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { Input } from '@/components/ui/input'

/** Campo de contraseña con botón para mostrarla (escribir a ciegas en el celular falla mucho). */
export function CampoClave(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={ver ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={ver}
        className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-3 focus-visible:outline-ring"
        onClick={() => {
          setVer((v) => !v)
        }}
      >
        {ver ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
      </button>
    </div>
  )
}

/** Mensaje de error de un formulario: ícono + texto (no depende solo del color). */
export function ErrorFormulario({ id, children }: { id: string; children: string | null }) {
  return (
    <p id={id} role="alert" className="flex min-h-6 items-start gap-2 text-sm font-semibold text-destructive">
      {children && <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
      {children}
    </p>
  )
}

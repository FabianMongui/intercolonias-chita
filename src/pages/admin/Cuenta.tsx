import { type SubmitEvent, useState } from 'react'
import { useOutletContext } from 'react-router'
import { toast } from 'sonner'
import { CampoClave, ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NOMBRE_ROL, type Perfil } from '@/hooks/usePerfil'
import { supabase } from '@/lib/supabase'

const MINIMO = 8

function mensajeError(mensaje: string): string {
  if (/different from the old/i.test(mensaje)) return 'La nueva contraseña debe ser distinta de la actual.'
  if (/weak|short|characters/i.test(mensaje)) return `La contraseña es muy débil. Usa al menos ${String(MINIMO)} caracteres.`
  if (/fetch|network/i.test(mensaje)) return 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.'
  return 'No pudimos cambiar la contraseña. Intenta de nuevo.'
}

/** Mi cuenta: datos del perfil y cambio de contraseña (§4.2). */
export default function Cuenta() {
  const perfil = useOutletContext<Perfil>()
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cambiar = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (nueva.length < MINIMO) {
      setError(`Usa al menos ${String(MINIMO)} caracteres.`)
      return
    }
    if (nueva !== repetida) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setError(null)
    setEnviando(true)
    const { error: errorAuth } = await supabase.auth.updateUser({ password: nueva })
    setEnviando(false)
    if (errorAuth) {
      setError(mensajeError(errorAuth.message))
      return
    }
    setNueva('')
    setRepetida('')
    toast.success('Contraseña actualizada')
  }

  return (
    <div className="flex max-w-sm flex-col gap-8">
      <title>Mi cuenta · Intercolonias Chita</title>
      <section className="flex flex-col gap-2">
        <h1 className="text-4xl">Mi cuenta</h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Nombre</dt>
          <dd className="font-semibold">{perfil.nombre ?? 'Sin nombre'}</dd>
          <dt className="text-muted-foreground">Rol</dt>
          <dd className="font-semibold">{NOMBRE_ROL[perfil.rol] ?? perfil.rol}</dd>
          <dt className="text-muted-foreground">Cancha sugerida</dt>
          <dd className="font-semibold">{perfil.cancha?.nombre ?? 'Ninguna'}</dd>
        </dl>
      </section>

      <section aria-labelledby="titulo-clave" className="flex flex-col gap-4">
        <h2 id="titulo-clave" className="text-3xl">
          Cambiar contraseña
        </h2>
        <form className="flex flex-col gap-4" onSubmit={(e) => void cambiar(e)} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva">Nueva contraseña</Label>
            <CampoClave
              id="nueva"
              autoComplete="new-password"
              aria-invalid={!!error}
              aria-describedby="ayuda-nueva error-clave"
              value={nueva}
              onChange={(e) => {
                setNueva(e.target.value)
              }}
            />
            <p id="ayuda-nueva" className="text-sm text-muted-foreground">
              Mínimo {MINIMO} caracteres.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="repetida">Repite la nueva contraseña</Label>
            <CampoClave
              id="repetida"
              autoComplete="new-password"
              aria-invalid={!!error}
              aria-describedby="error-clave"
              value={repetida}
              onChange={(e) => {
                setRepetida(e.target.value)
              }}
            />
          </div>
          <ErrorFormulario id="error-clave">{error}</ErrorFormulario>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </section>
    </div>
  )
}

import { LogIn } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { CampoClave, ErrorFormulario } from '@/components/CampoClave'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSesion } from '@/hooks/useSesion'
import { supabase } from '@/lib/supabase'
import { AdminCargando } from '@/pages/admin/AdminCargando'

/** Solo se vuelve a rutas del panel (evita redirecciones a otros sitios). */
function destinoSeguro(volver: string | null): string {
  if (!volver) return '/admin'
  const valido = volver === '/admin' || (volver.startsWith('/admin/') && !volver.startsWith('/admin/login'))
  return valido ? volver : '/admin'
}

function mensajeError(mensaje: string): string {
  if (/invalid login credentials/i.test(mensaje)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(mensaje)) return 'Esta cuenta no está confirmada. Avísale al super admin.'
  if (/fetch|network/i.test(mensaje)) return 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.'
  return 'No pudimos iniciar sesión. Intenta de nuevo.'
}

export default function Login() {
  const { cargando, sesion } = useSesion()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const destino = destinoSeguro(params.get('volver'))
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (cargando) return <AdminCargando />
  if (sesion) return <Navigate to={destino} replace />

  const entrar = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!correo.trim() || !clave) {
      setError('Escribe tu correo y tu contraseña.')
      return
    }
    setError(null)
    setEnviando(true)
    const { error: errorAuth } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave })
    setEnviando(false)
    if (errorAuth) {
      setError(mensajeError(errorAuth.message))
      return
    }
    void navigate(destino, { replace: true })
  }

  return (
    <>
      <title>Entrar al panel · Intercolonias Chita</title>
      <header className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-screen-sm items-center gap-3 px-4 py-2">
          <img src="/assets/Chita.png" alt="" width={40} height={40} className="size-10 shrink-0 object-contain" />
          <span className="font-display text-3xl leading-none">Intercolonias Chita</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 pt-8 pb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl">Panel de administración</h1>
          <p className="text-muted-foreground">Entra con el correo y la contraseña que te dio el organizador.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => void entrar(e)} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              aria-invalid={!!error}
              aria-describedby="error-login"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="clave">Contraseña</Label>
            <CampoClave
              id="clave"
              autoComplete="current-password"
              required
              aria-invalid={!!error}
              aria-describedby="error-login"
              value={clave}
              onChange={(e) => {
                setClave(e.target.value)
              }}
            />
          </div>

          <ErrorFormulario id="error-login">{error}</ErrorFormulario>

          <Button type="submit" size="lg" disabled={enviando}>
            <LogIn aria-hidden />
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </main>
    </>
  )
}

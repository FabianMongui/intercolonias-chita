// Edge Function admin-usuarios (§4.2 super admin 7): crear y borrar usuarios del panel, ponerles una
// contraseña nueva y ver sus correos. Usa la secret key, que vive solo aquí (nunca en el navegador), y antes de
// hacer nada verifica que quien llama sea un super admin activo.
import { createClient } from 'npm:@supabase/supabase-js@2'

const URL_SUPABASE = Deno.env.get('SUPABASE_URL') ?? ''
const primera = (variable: string) => Object.values(JSON.parse(Deno.env.get(variable) ?? '{}') as Record<string, string>)[0]
const PUBLISHABLE = primera('SUPABASE_PUBLISHABLE_KEYS')
const SECRET = primera('SUPABASE_SECRET_KEYS')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const responder = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { ...CORS, 'Content-Type': 'application/json' } })
const fallar = (mensaje: string, estado = 400) => responder({ error: mensaje }, estado)

/** Contraseña temporal fácil de dictar: sin caracteres que se confunden (0/O, 1/l/I). */
function contrasenaTemporal(largo = 10): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const azar = crypto.getRandomValues(new Uint32Array(largo))
  return Array.from(azar, (n) => letras[n % letras.length]).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return fallar('Método no permitido', 405)
  if (!PUBLISHABLE || !SECRET) return fallar('Falta configurar las llaves del proyecto en Supabase.', 500)

  // 1) ¿Quién llama? Su sesión debe ser de un super admin activo (lo decide la base con es_super_admin()).
  const autorizacion = req.headers.get('Authorization') ?? ''
  if (!autorizacion.startsWith('Bearer ')) return fallar('Inicia sesión de nuevo.', 401)
  const comoUsuario = createClient(URL_SUPABASE, PUBLISHABLE, {
    global: { headers: { Authorization: autorizacion } },
    auth: { persistSession: false },
  })
  const { data: usuario, error: errorUsuario } = await comoUsuario.auth.getUser(autorizacion.slice(7))
  if (errorUsuario || !usuario.user) return fallar('Tu sesión venció. Inicia sesión de nuevo.', 401)
  const { data: esSuper, error: errorRol } = await comoUsuario.rpc('es_super_admin')
  if (errorRol) return fallar('No se pudo verificar tu rol.', 500)
  if (esSuper !== true) return fallar('Solo el super admin puede gestionar usuarios.', 403)

  // 2) Ya autorizado: cliente con la secret key (salta RLS; solo para estas acciones).
  const admin = createClient(URL_SUPABASE, SECRET, { auth: { persistSession: false, autoRefreshToken: false } })
  let cuerpo: Record<string, unknown>
  try {
    cuerpo = (await req.json()) as Record<string, unknown>
  } catch {
    return fallar('Pedido inválido.')
  }

  switch (cuerpo.accion) {
    case 'correos': {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (error) return fallar('No se pudieron leer los correos.', 500)
      return responder({ correos: Object.fromEntries(data.users.map((u) => [u.id, u.email ?? ''])) })
    }

    case 'crear': {
      const correo = String(cuerpo.correo ?? '').trim().toLowerCase()
      const nombre = String(cuerpo.nombre ?? '').trim()
      const rol = cuerpo.rol === 'super_admin' ? 'super_admin' : 'admin'
      const canchaId = typeof cuerpo.cancha_id === 'number' ? cuerpo.cancha_id : null
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return fallar('Escribe un correo válido.')
      if (!nombre) return fallar('Escribe el nombre de la persona.')
      const contrasena = contrasenaTemporal()
      const { data, error } = await admin.auth.admin.createUser({
        email: correo,
        password: contrasena,
        email_confirm: true,
        user_metadata: { nombre },
      })
      if (error) {
        const yaExiste = /already|registered|exists/i.test(error.message)
        return fallar(yaExiste ? 'Ya hay un usuario con ese correo.' : 'No se pudo crear el usuario.', yaExiste ? 409 : 500)
      }
      // El perfil lo crea el trigger crear_perfil; aquí se le pone rol, cancha y se activa.
      const { error: errorPerfil } = await admin
        .from('perfiles')
        .update({ nombre, rol, cancha_id: rol === 'admin' ? canchaId : null, activo: true })
        .eq('id', data.user.id)
      if (errorPerfil) {
        await admin.auth.admin.deleteUser(data.user.id)
        return fallar('No se pudo guardar el perfil del usuario.', 500)
      }
      return responder({ id: data.user.id, correo, contrasena })
    }

    case 'restablecer': {
      const id = String(cuerpo.id ?? '')
      if (!id) return fallar('Falta el usuario.')
      if (id === usuario.user.id) return fallar('Tu propia contraseña se cambia desde "Mi cuenta".')
      const contrasena = contrasenaTemporal()
      const { error } = await admin.auth.admin.updateUserById(id, { password: contrasena })
      if (error) return fallar('No se pudo cambiar la contraseña.', 500)
      return responder({ contrasena })
    }

    case 'borrar': {
      const id = String(cuerpo.id ?? '')
      if (!id) return fallar('Falta el usuario.')
      if (id === usuario.user.id) return fallar('No puedes borrar tu propia cuenta.')
      // La base tampoco deja borrar al último super admin activo (migración 20); aquí se revisa antes
      // para dar el motivo claro (Auth devuelve un error genérico).
      const { data: activos, error: errorActivos } = await admin
        .from('perfiles')
        .select('id')
        .eq('rol', 'super_admin')
        .eq('activo', true)
      if (errorActivos) return fallar('No se pudo borrar el usuario.', 500)
      if (activos.length === 1 && activos[0]?.id === id) return fallar('Debe quedar al menos un super admin activo.', 409)
      // Borra la cuenta y, en cascada, su perfil.
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) return fallar('No se pudo borrar el usuario.', 500)
      return responder({ ok: true })
    }

    default:
      return fallar('Acción desconocida.')
  }
})

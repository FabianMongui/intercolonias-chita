/** Lado máximo del escudo guardado (§3.6: ~256 px en WebP). */
const LADO = 256
const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg', 'image/webp']
const LIMITE_BYTES = 1024 * 1024

/**
 * Redimensiona la imagen elegida a 256 px como máximo (sin deformarla) y la convierte a WebP
 * en el navegador, para que pese poco con datos móviles. Lanza un error con mensaje en español.
 */
export async function prepararEscudo(archivo: File): Promise<Blob> {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    throw new Error('El escudo debe ser una imagen PNG, JPG o WebP.')
  }
  let imagen: ImageBitmap
  try {
    imagen = await createImageBitmap(archivo)
  } catch {
    throw new Error('No se pudo leer la imagen. Prueba con otra.')
  }
  const escala = Math.min(1, LADO / Math.max(imagen.width, imagen.height))
  const ancho = Math.max(1, Math.round(imagen.width * escala))
  const alto = Math.max(1, Math.round(imagen.height * escala))
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('Este navegador no puede procesar la imagen.')
  contexto.drawImage(imagen, 0, 0, ancho, alto)
  imagen.close()
  const blob = await new Promise<Blob | null>((resolver) => {
    lienzo.toBlob(resolver, 'image/webp', 0.85)
  })
  if (blob?.type !== 'image/webp') throw new Error('Este navegador no puede convertir la imagen a WebP.')
  if (blob.size > LIMITE_BYTES) throw new Error('La imagen sigue pesando más de 1 MB. Prueba con otra.')
  return blob
}

/** "Chita FC" → "chita-fc" (para la ruta del archivo). */
export function slugArchivo(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'equipo'
  )
}

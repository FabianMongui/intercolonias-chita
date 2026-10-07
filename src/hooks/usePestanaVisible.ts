import { useEffect, useState } from 'react'

/** true mientras la pestaña está visible (`document.visibilityState`). */
export function usePestanaVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const alCambiar = () => {
      setVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => {
      document.removeEventListener('visibilitychange', alCambiar)
    }
  }, [])

  return visible
}

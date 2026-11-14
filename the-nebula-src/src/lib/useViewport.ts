import { useEffect, useState } from 'react'

const typing = () => {
  const el = document.activeElement
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
}

/**
 * Window size. While someone is typing, a shrinking height is ignored: that's
 * the on-screen keyboard opening, and the planet shouldn't jump because of it.
 */
export function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () =>
      setSize((prev) => {
        const w = window.innerWidth
        const h = window.innerHeight
        if (w === prev.w && h < prev.h && typing()) return prev
        return w === prev.w && h === prev.h ? prev : { w, h }
      })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

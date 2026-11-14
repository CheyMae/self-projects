import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import type { CosmosMode } from '../lib/geometry'
import { useGeometry } from '../lib/useGeometry'
import { Atmosphere } from './Atmosphere'

function modeFor(path: string): CosmosMode {
  if (path === '/' || path === '/password') return 'welcome'
  if (/^\/library\/[^/]+\/?$/.test(path)) return 'home'
  return 'hidden'
}

/**
 * The planet, its orbits and the starfield. It stays mounted across pages so
 * that moving from Welcome to Home glides the planet to the left while the
 * orbits spin, instead of cutting between two separate pictures.
 */
export function Cosmos() {
  const { pathname } = useLocation()
  const mode = modeFor(pathname)
  const g = useGeometry(mode)

  // Count real moves between welcome ⇄ home to replay the spin animation.
  const [spins, setSpins] = useState(0)
  const last = useRef<CosmosMode>(mode)
  const [instant, setInstant] = useState(true)
  useEffect(() => {
    const prev = last.current
    last.current = mode
    if (prev !== mode && prev !== 'hidden' && mode !== 'hidden') setSpins((n) => n + 1)
  }, [mode])
  // Skip the glide on first paint so the planet doesn't fly in on load.
  useEffect(() => {
    const t = window.setTimeout(() => setInstant(false), 50)
    return () => window.clearTimeout(t)
  }, [])

  const boost = spins > 0 ? ' c-spin--boost' : ''

  const ring = (radius: number): CSSProperties => ({
    left: g.cx - radius,
    top: g.cy - radius,
    width: radius * 2,
    height: radius * 2,
  })

  return (
    <div
      className={`cosmos cosmos--${mode}${g.compact ? ' cosmos--compact' : ''}${instant ? ' cosmos--instant' : ''}`}
      aria-hidden="true"
    >
      <Atmosphere />
      <div className="c-ring c-ring--drift" style={ring(g.rings.drift)}>
        <div className={`c-spin c-spin--slow${boost}`} key={`a${spins}`}>
          <span className="c-moon" style={{ top: '50%', left: 0 }} />
        </div>
      </div>
      <div className="c-ring c-ring--dashed" style={ring(g.rings.dashed)}>
        <div className={`c-spin c-spin--rev${boost}`} key={`b${spins}`}>
          <span className="c-moon" style={{ top: 0, left: '50%' }} />
          <span className="c-moon c-moon--sm" style={{ bottom: '14.6%', right: '14.6%' }} />
        </div>
      </div>
      <div className="c-ring c-ring--orbit" style={ring(g.r)}>
        <div className={`c-spin${boost}`} key={`c${spins}`}>
          <span className="c-moon c-moon--sm" style={{ bottom: 0, left: '50%' }} />
        </div>
      </div>
      <div className="c-ring c-ring--halo" style={ring(g.rings.halo)} />
      <div className="c-ring c-ring--disc" style={ring(g.rings.disc)} />
    </div>
  )
}

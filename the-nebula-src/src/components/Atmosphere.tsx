import { useMemo } from 'react'

// Deterministic pseudo-random so the starfield is identical on every render.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function Atmosphere({ variant = 'home' }: { variant?: 'home' | 'welcome' }) {
  const stars = useMemo(() => {
    const rand = seeded(variant === 'home' ? 42 : 7)
    return Array.from({ length: 70 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() < 0.2 ? 3 : rand() < 0.5 ? 2 : 1,
      opacity: 0.25 + rand() * 0.6,
      gold: rand() < 0.12,
      delay: rand() * 6,
    }))
  }, [variant])

  return (
    <div className={`atmosphere atmosphere--${variant}`} aria-hidden="true">
      <div className="glow glow--gold" />
      <div className="glow glow--blue" />
      {variant === 'welcome' && <div className="glow glow--ember" />}
      {stars.map((s, i) => (
        <span
          key={i}
          className={`star${s.gold ? ' star--gold' : ''}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

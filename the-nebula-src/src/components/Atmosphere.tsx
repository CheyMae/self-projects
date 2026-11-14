import { useEffect, useMemo, useState } from 'react'

// Deterministic pseudo-random so the starfield is identical on every render.
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

interface ShootingStar {
  id: number
  x: number
  y: number
  angle: number
  length: number
  duration: number
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Fixed starfield: twinkling stars, soft glows and the occasional shooting star. */
export function Atmosphere() {
  const stars = useMemo(() => {
    const rand = seeded(42)
    return Array.from({ length: 90 }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      size: rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1,
      opacity: 0.3 + rand() * 0.6,
      gold: rand() < 0.12,
      delay: rand() * 8,
      duration: 3 + rand() * 5,
      twinkle: rand() < 0.7,
    }))
  }, [])

  const [shooting, setShooting] = useState<ShootingStar[]>([])

  useEffect(() => {
    if (reducedMotion()) return
    let timer: number
    let id = 0
    const spawn = () => {
      const star: ShootingStar = {
        id: ++id,
        x: 20 + Math.random() * 75,
        y: Math.random() * 45,
        angle: 145 + Math.random() * 30,
        length: 90 + Math.random() * 110,
        duration: 0.9 + Math.random() * 0.8,
      }
      setShooting((list) => [...list.slice(-2), star])
      window.setTimeout(
        () => setShooting((list) => list.filter((s) => s.id !== star.id)),
        star.duration * 1000 + 200,
      )
      timer = window.setTimeout(spawn, 5000 + Math.random() * 9000)
    }
    timer = window.setTimeout(spawn, 2500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="glow glow--gold" />
      <div className="glow glow--blue" />
      <div className="glow glow--ember" />
      {stars.map((s, i) => (
        <span
          key={i}
          className={`star${s.gold ? ' star--gold' : ''}${s.twinkle ? ' star--twinkle' : ''}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {shooting.map((s) => (
        <span
          key={s.id}
          className="shooting-star"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.length,
              '--a': `${s.angle}deg`,
              animationDuration: `${s.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

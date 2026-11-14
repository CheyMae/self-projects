import { ArrowRight, Bookmark, KeyRound, LogOut, Plus } from 'lucide-react'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { TabBar } from '../components/TabBar'
import { WorldIcon } from '../components/WorldIcon'
import { useAuth } from '../lib/auth'
import { onOrbit } from '../lib/geometry'
import { findLibrary } from '../lib/libraries'
import { useGeometry } from '../lib/useGeometry'
import { useLibrary } from '../lib/useLibrary'
import { ORBIT_WORLD_SLOTS, recordVisit } from '../lib/worlds'

interface OrbitItem {
  key: string
  label: string
  to: string
  icon: ReactNode
}

// Nodes sit 20° apart on the orbit, centred on the planet's horizon.
const STEP_DEG = 20

export function Home() {
  const { name: param } = useParams()
  const library = findLibrary(param)
  const { me, session, signOut } = useAuth()
  const { data, error } = useLibrary(library)
  const g = useGeometry('home')

  const isMine = library === me

  useEffect(() => {
    if (data?.ownerId && session && !isMine) recordVisit(data.ownerId, session.user.id)
  }, [data?.ownerId, session, isMine])

  if (!library) return <Navigate to={me ? `/library/${me}` : '/'} replace />

  const worlds = data?.worlds ?? []
  const items: OrbitItem[] = worlds.slice(0, ORBIT_WORLD_SLOTS).map((wld) => ({
    key: wld.id,
    label: wld.title.trim() || 'Untitled world',
    to: `/world/${wld.id}`,
    icon: <WorldIcon name={wld.icon} size={g.compact ? 20 : 24} />,
  }))
  if (isMine) {
    items.push({
      key: 'new',
      label: 'Start writing',
      to: `/library/${library}/new`,
      icon: <Plus size={g.compact ? 22 : 26} strokeWidth={1.3} />,
    })
  }
  items.push({
    key: 'archive',
    label: 'Archive',
    to: `/library/${library}/archive`,
    icon: <Bookmark size={g.compact ? 20 : 24} strokeWidth={1.4} />,
  })

  const chapters = worlds.reduce((sum, wld) => sum + wld.chapters, 0)
  const stats = [
    { value: worlds.length, label: 'Worlds' },
    { value: chapters, label: 'Volumes' },
    { value: data?.wanderers ?? 0, label: 'Wanderers' },
  ]

  const style = {
    '--cx': `${g.cx}px`,
    '--cy': `${g.cy}px`,
    '--k': g.scale,
    '--node': `${g.node}px`,
  } as CSSProperties

  const account = (
    <div className="account-links">
      <Link to="/password" className="account-link">
        <KeyRound size={14} strokeWidth={1.5} /> <span>Password</span>
      </Link>
      <button className="account-link" onClick={signOut} title={`Signed in as ${me ?? ''}`}>
        <LogOut size={14} strokeWidth={1.5} /> <span>Sign out</span>
      </button>
    </div>
  )

  return (
    <main className={`home${g.compact ? ' home--compact' : ''}`} style={style}>
      <div className="home__tabs">
        <TabBar />
      </div>
      {!g.compact && account}

      <div className="hero-content" key={library}>
        <p className="eyebrow">Welcome to</p>
        <h1 className="display display--left">The Library</h1>
        <div className="divider divider--left" />
        <p className="hero-content__sub">This is {library}’s collection of worlds</p>
        <dl className="stats">
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {items.map((item, i) => {
        const deg = (i - (items.length - 1) / 2) * STEP_DEG
        const p = onOrbit(g, deg)
        return (
          <Link
            key={`${library}-${item.key}`}
            to={item.to}
            className="orbit-node"
            style={{ left: p.x, top: p.y, animationDelay: `${0.55 + i * 0.08}s` } as CSSProperties}
          >
            <span className="orbit-node__circle">{item.icon}</span>
            <span className="orbit-node__label">{item.label}</span>
          </Link>
        )
      })}

      <aside className="highlights">
        <p className="micro">Quick links to get you started</p>
        <Link to="/getting-started" className="info-card info-card--link">
          <h2>Welcome to The Library</h2>
          <p>Get onboarded, learn how to navigate, and explore how our Nebula works.</p>
          <span className="round-btn" aria-hidden="true">
            <ArrowRight size={20} strokeWidth={1.5} />
          </span>
        </Link>
        <div className="info-card">
          <h2>Under Construction</h2>
          <p>More soon!</p>
        </div>
        {error && <p className="error-text">{error}</p>}
        {data && !data.ownerId && <p className="muted-text">{library} hasn’t opened their Library yet.</p>}
        {g.compact && account}
      </aside>
    </main>
  )
}

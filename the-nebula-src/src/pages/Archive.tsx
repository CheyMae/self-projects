import { ArrowRight, Plus } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BackLink, Breadcrumb } from '../components/BackLink'
import { WorldIcon } from '../components/WorldIcon'
import { useAuth } from '../lib/auth'
import { findLibrary } from '../lib/libraries'
import { useLibrary } from '../lib/useLibrary'
import { ORBIT_WORLD_SLOTS } from '../lib/worlds'

export function Archive() {
  const { name } = useParams()
  const library = findLibrary(name)
  const { me } = useAuth()
  const { data, error } = useLibrary(library)

  if (!library) return <Navigate to={me ? `/library/${me}` : '/'} replace />
  const isMine = library === me
  const worlds = data?.worlds ?? []

  return (
    <main className="page page--plain">
      <header className="page-top">
        <BackLink to={`/library/${library}`} />
        <Breadcrumb
          parts={[
            { label: 'The Library', to: `/library/${library}` },
            { label: library, to: `/library/${library}` },
            { label: 'Archive' },
          ]}
        />
      </header>

      <section className="archive">
        <div className="start__heading">
          <p className="eyebrow">Archive</p>
          <h1 className="display">{isMine ? 'Every world you’ve written' : `${library}’s worlds`}</h1>
          <p className="start__lead">
            The {ORBIT_WORLD_SLOTS} most recently touched worlds orbit the Home. Every world lives here.
          </p>
        </div>

        {!data && !error && <p className="small-muted">Gathering worlds…</p>}
        {error && <p className="error-text">{error}</p>}

        {data && worlds.length === 0 && (
          <div className="empty">
            <p>{isMine ? 'No worlds yet.' : `${library} hasn’t written any worlds yet.`}</p>
            {isMine && (
              <Link className="btn btn--gold" to={`/library/${library}/new`}>
                <Plus size={16} /> Start writing
              </Link>
            )}
          </div>
        )}

        <ul className="archive__list">
          {worlds.map((w, i) => (
            <li key={w.id}>
              <Link to={`/world/${w.id}`} className="archive__row">
                <span className="orbit-node__circle orbit-node__circle--sm">
                  <WorldIcon name={w.icon} size={18} />
                </span>
                <span className="archive__title">{w.title.trim() || 'Untitled world'}</span>
                {i < ORBIT_WORLD_SLOTS && <span className="tag">In orbit</span>}
                <span className="archive__date">Edited {new Date(w.updated_at).toLocaleDateString()}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

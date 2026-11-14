import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackLink, Breadcrumb } from '../components/BackLink'
import { useAuth } from '../lib/auth'
import { findLibrary } from '../lib/libraries'
import { createWorld } from '../lib/worlds'

type Choice = 'blank' | 'worldbuilding'

export function StartWriting() {
  const { name } = useParams()
  const library = findLibrary(name)
  const { me, session } = useAuth()
  const navigate = useNavigate()
  const [choice, setChoice] = useState<Choice>('blank')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only the owner can start a world in their own Library.
  if (!library || library !== me) return <Navigate to={me ? `/library/${me}` : '/'} replace />

  const create = async () => {
    if (!session) return
    setBusy(true)
    setError(null)
    try {
      const id = await createWorld(session.user.id, choice)
      navigate(`/world/${id}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the world.')
      setBusy(false)
    }
  }

  return (
    <main className="page page--plain">
      <header className="page-top">
        <BackLink to={`/library/${library}`} />
        <Breadcrumb
          parts={[
            { label: 'The Library', to: `/library/${library}` },
            { label: library, to: `/library/${library}` },
            { label: 'New world' },
          ]}
        />
      </header>

      <section className="start">
        <div className="start__heading">
          <p className="eyebrow">Start writing</p>
          <h1 className="display">Begin a new world</h1>
          <p className="start__lead">Every world needs a first page. Choose where yours begins.</p>
        </div>

        <div className="start__options" role="radiogroup" aria-label="Starting point">
          <TemplateCard
            selected={choice === 'blank'}
            onSelect={() => setChoice('blank')}
            title="Blank page"
            tag="Empty"
            description="Start from nothing — a quiet, empty page. Add headings, lists, callouts and more with “/”."
            preview={
              <div className="tpl-preview tpl-preview--blank">
                <span className="bar bar--title" />
                <span className="bar bar--sub" />
                <span className="tpl-preview__hint">Type ‘/’ for commands</span>
                <span className="tpl-preview__caret" />
              </div>
            }
          />
          <TemplateCard
            selected={choice === 'worldbuilding'}
            onSelect={() => setChoice('worldbuilding')}
            title="Chey’s World-Building Template"
            tag="By Chey"
            tagTone="blue"
            description="A guided structure for building a world: characters, locations, factions, timelines and lore — ready to fill in."
            preview={
              <div className="tpl-preview tpl-preview--template">
                <span className="tpl-preview__cover" />
                <span className="tpl-preview__icon" />
                <span className="bar bar--gold" />
                <span className="bar bar--sub" />
                <div className="tpl-preview__cards">
                  {[0, 1, 2].map((i) => (
                    <span key={i}>
                      <i />
                      <b />
                    </span>
                  ))}
                </div>
                <div className="tpl-preview__lines">
                  <span />
                  <span />
                </div>
              </div>
            }
          />
        </div>

        <footer className="start__footer">
          <p className="small-muted">You can change templates later from the page menu.</p>
          <div className="start__actions">
            <Link className="btn btn--ghost" to={`/library/${library}`}>
              Cancel
            </Link>
            <button className="btn btn--gold" onClick={create} disabled={busy}>
              {busy ? 'Creating…' : 'Create world'} <ArrowRight size={16} />
            </button>
          </div>
        </footer>
        {error && <p className="error-text">{error}</p>}
      </section>
    </main>
  )
}

function TemplateCard(props: {
  selected: boolean
  onSelect: () => void
  title: string
  tag: string
  tagTone?: 'blue'
  description: string
  preview: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={props.selected}
      className={`tpl-card${props.selected ? ' tpl-card--selected' : ''}`}
      onClick={props.onSelect}
    >
      <div className="tpl-card__preview">
        {props.preview}
        <span className="tpl-card__radio">{props.selected && <Check size={12} strokeWidth={2} />}</span>
      </div>
      <div className="tpl-card__title">
        <h2>{props.title}</h2>
        <span className={`tag${props.tagTone ? ` tag--${props.tagTone}` : ''}`}>{props.tag}</span>
      </div>
      <p>{props.description}</p>
    </button>
  )
}

import { Sparkle } from 'lucide-react'
import { useState } from 'react'
import { BackLink, Breadcrumb } from '../components/BackLink'
import { useAuth } from '../lib/auth'

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="callout">
      <Sparkle size={14} strokeWidth={1.5} />
      <p>{children}</p>
    </div>
  )
}

export function GettingStarted() {
  const { me } = useAuth()
  const home = me ? `/library/${me}` : '/'
  const [checks, setChecks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nebula.onboarding') ?? '[false,false]') as boolean[]
    } catch {
      return [false, false]
    }
  })
  const toggle = (i: number) => {
    const next = checks.map((c, j) => (j === i ? !c : c))
    setChecks(next)
    try {
      localStorage.setItem('nebula.onboarding', JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <main className="page page--plain world world--cover">
      <div className="cover cover--plain" />
      <header className="page-top">
        <BackLink to={home} />
        <Breadcrumb parts={[{ label: 'The Nebula', to: home }, { label: 'Getting started' }]} />
      </header>

      <article className="world__body doc">
        <div className="page-icon-wrap">
          <span className="page-icon">
            <Sparkle size={36} strokeWidth={1.4} />
          </span>
        </div>
        <h1 className="world__title">Welcome to The Library</h1>

        <div className="properties">
          <div className="property">
            <span className="property__key">Status</span>
            <span className="property__value">Introduction</span>
          </div>
          <div className="property">
            <span className="property__key">Shelf</span>
            <span className="property__value">Everyone</span>
          </div>
        </div>
        <hr className="world__rule" />

        <p>
          The Nebula is home to six Libraries — one each for Ara, Chey, Chin, Kosca, Mae and Otep. Your
          Library holds every world you write. Here’s how to find your way around.
        </p>

        <h2>Find your way</h2>
        <ul>
          <li>The six names at the top are the Libraries. Select a name to visit that reader’s worlds.</li>
          <li>On your Home, the orbit is your navigation — each circle opens one of your worlds.</li>
        </ul>
        <Callout>
          Your orbit holds up to six circles. Start Writing and Archive always stay, so up to four worlds
          orbit at once — older ones move into Archive.
        </Callout>

        <h2>Start a world</h2>
        <ol>
          <li>Press Start Writing on your Home.</li>
          <li>Choose a Blank page, or begin from Chey’s world-building template.</li>
          <li>Name your world, then add an icon and a cover.</li>
        </ol>

        <h2>Write the way you think</h2>
        <ul>
          <li>Type / on an empty line to add headings, lists, to-dos, quotes, callouts and dividers.</li>
          <li>Select any text to make it bold, italic, underlined, or a link.</li>
          <li>Hover a block and drag its ⠿ handle to move it.</li>
        </ul>
        <Callout>
          Please note that the backend of the site is still under testing and has limited space. Please
          refrain from uploading photos <strong>for now.</strong>
        </Callout>

        <h2>Before you begin</h2>
        <div className="checklist">
          {['Visit another reader’s Library', 'Start your first world'].map((label, i) => (
            <label key={label}>
              <input type="checkbox" checked={!!checks[i]} onChange={() => toggle(i)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <blockquote>“Nothing written here is ever lost — only waiting to be read.”</blockquote>
      </article>
    </main>
  )
}

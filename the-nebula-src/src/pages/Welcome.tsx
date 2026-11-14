import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Atmosphere } from '../components/Atmosphere'
import { useAuth } from '../lib/auth'
import { LIBRARIES, type LibraryName } from '../lib/libraries'

// Angle (degrees, 0 = right, clockwise) of each Library on the welcome ring.
const ANGLES: Record<LibraryName, number> = {
  Ara: -120,
  Chey: -60,
  Chin: 0,
  Kosca: 60,
  Mae: 120,
  Otep: 180,
}

type Step = 'intro' | 'select' | 'password'

export function Welcome() {
  const { me, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('intro')
  const [chosen, setChosen] = useState<LibraryName | null>(null)
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'password') inputRef.current?.focus()
  }, [step])

  if (!loading && me) return <Navigate to={`/library/${me}`} replace />

  const choose = (name: LibraryName) => {
    setChosen(name)
    setPassword('')
    setError(null)
    setStep('password')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!chosen || !password) return
    setBusy(true)
    setError(null)
    const err = await signIn(chosen, password)
    setBusy(false)
    if (err) setError(err)
    else navigate(`/library/${chosen}`, { replace: true })
  }

  return (
    <main className={`welcome welcome--${step}`}>
      <Atmosphere variant="welcome" />
      <div className="welcome__brand">The Nebula</div>
      {step === 'select' && <div className="welcome__dim" aria-hidden="true" />}

      <div className="welcome__stage">
        <div className="ring ring--drift" />
        <div className="ring ring--orbit" />
        <div className="ring ring--dashed" />
        <div className="ring ring--halo" />
        <div className="ring ring--disc" />

        <div className="welcome__content">
          <p className="eyebrow">Welcome to</p>
          <h1 className="display">The Nebula</h1>
          <div className="divider" />

          {step === 'intro' && (
            <>
              <p className="welcome__tagline">
                Six Libraries. Countless worlds.
                <br />
                Pick yours and step inside.
              </p>
              <button className="btn btn--gold" onClick={() => setStep('select')}>
                Enter the Nebula <ArrowRight size={16} />
              </button>
            </>
          )}

          {step === 'select' && <p className="welcome__select">Select a name</p>}

          {step === 'password' && chosen && (
            <form className="welcome__form" onSubmit={submit}>
              <p className="welcome__name">{chosen}</p>
              <label className="field">
                <span className="field__label">Password</span>
                <span className={`field__box${error ? ' field__box--error' : ''}`}>
                  <Lock size={14} strokeWidth={1.5} />
                  <input
                    ref={inputRef}
                    type={reveal ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={!!error}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? 'Hide password' : 'Show password'}
                  >
                    {reveal ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
                  </button>
                </span>
                <span className={`field__hint${error ? ' field__hint--error' : ''}`}>
                  {error ?? `Only ${chosen} can open this Library.`}
                </span>
              </label>
              <button className="btn btn--gold" type="submit" disabled={busy || !password}>
                {busy ? 'Opening…' : 'Enter Library'} <ArrowRight size={16} />
              </button>
              <p className="welcome__switch">
                Not {chosen}?{' '}
                <button type="button" className="link-btn" onClick={() => setStep('select')}>
                  Choose another name
                </button>
              </p>
            </form>
          )}
        </div>

        {LIBRARIES.map((name) => {
          const selected = step === 'password' && chosen === name
          const faded = step === 'password' && chosen !== name
          return (
            <button
              key={name}
              type="button"
              className={`lib-node${selected ? ' lib-node--selected' : ''}${faded ? ' lib-node--faded' : ''}${
                step === 'select' ? ' lib-node--focus' : ''
              }`}
              style={{ '--angle': `${ANGLES[name]}deg` } as CSSProperties}
              onClick={() => choose(name)}
              aria-label={`Sign in as ${name}`}
            >
              <span className="lib-node__circle">{name[0]}</span>
              <span className="lib-node__label">{name}</span>
            </button>
          )
        })}
      </div>

      <p className="welcome__footer">
        {step === 'select'
          ? 'Each Library is private — select your name to sign in'
          : 'A private Nebula for six readers  ·  Sign in with your Library name'}
      </p>
    </main>
  )
}

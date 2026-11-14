import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { onOrbit } from '../lib/geometry'
import { useAuth } from '../lib/auth'
import { LIBRARIES, type LibraryName } from '../lib/libraries'
import { useGeometry } from '../lib/useGeometry'

// Angle (degrees, 0 = right, clockwise) of each Library on the welcome ring.
const ANGLES: Record<LibraryName, number> = {
  Ara: -120,
  Chey: -60,
  Chin: 0,
  Kosca: 60,
  Mae: 120,
  Otep: 180,
}

type Step = 'intro' | 'select' | 'password' | 'create'

/**
 * Welcome → choose a name → password → (first visit) create your own password.
 * With `change`, it opens straight on the create-password step for a signed-in reader.
 */
export function Welcome({ change = false }: { change?: boolean }) {
  const { me, loading, needsPassword, signIn, setPassword, skipPassword } = useAuth()
  const navigate = useNavigate()
  const g = useGeometry('welcome')
  const [step, setStep] = useState<Step>(change ? 'create' : 'intro')
  const [chosen, setChosen] = useState<LibraryName | null>(null)
  const [leaving, setLeaving] = useState(false)

  const name = chosen ?? me

  // Signed in: either ask for a new password (first visit) or glide into the Library.
  const leavingRef = useRef(false)
  useEffect(() => {
    if (loading || !me || change || leavingRef.current) return
    if (needsPassword) {
      setChosen(me)
      setStep('create')
    } else {
      leavingRef.current = true
      setLeaving(true)
      window.setTimeout(() => navigate(`/library/${me}`, { replace: true }), 380)
    }
  }, [loading, me, needsPassword, change, navigate])

  if (change && !loading && !me) return <Navigate to="/" replace />

  const goHome = () => {
    if (!me) return
    leavingRef.current = true
    setLeaving(true)
    window.setTimeout(() => navigate(`/library/${me}`, { replace: true }), 380)
  }

  const choose = (lib: LibraryName) => {
    setChosen(lib)
    setStep('password')
  }

  const core = (
    <div className="welcome__core">
      {step === 'create' ? (
        <>
          <p className="eyebrow">{change ? 'Keep your Library safe' : `First time here, ${name}?`}</p>
          <h1 className="display display--create">{change ? 'New password' : 'Make it yours'}</h1>
        </>
      ) : (
        <>
          <p className="eyebrow">Welcome to</p>
          <h1 className="display">The Nebula</h1>
        </>
      )}
      <div className="divider" />
      {step === 'select' && <p className="welcome__select">Select a name</p>}
      {step === 'password' && name && <p className="welcome__name">{name}</p>}
    </div>
  )

  let panel: ReactNode = null
  if (step === 'intro') {
    panel = (
      <div className="welcome__panel">
        <p className="welcome__tagline">
          Six Libraries. Countless worlds.
          <br />
          Pick yours and step inside.
        </p>
        <button className="btn btn--gold" onClick={() => setStep('select')}>
          Enter the Nebula <ArrowRight size={16} />
        </button>
      </div>
    )
  } else if (step === 'select' && g.compact) {
    panel = (
      <div className="welcome__panel">
        <p className="welcome__tagline welcome__tagline--sm">
          Each Library is private —<br />
          select your name to sign in
        </p>
      </div>
    )
  } else if (step === 'password' && chosen) {
    panel = (
      <SignInForm
        key={chosen}
        name={chosen}
        onSubmit={(pw) => signIn(chosen, pw)}
        onSwitch={() => setStep('select')}
      />
    )
  } else if (step === 'create' && name) {
    panel = (
      <CreatePasswordForm
        intro={
          change
            ? 'Choose a new password only you know.'
            : 'You entered with the password you were given. Choose a new one only you know.'
        }
        onSubmit={async (pw) => {
          const err = await setPassword(pw)
          if (!err) goHome()
          return err
        }}
        secondary={change ? 'Cancel' : 'Keep my given password for now'}
        onSecondary={async () => {
          if (!change) await skipPassword()
          goHome()
        }}
      />
    )
  }

  const style = {
    '--cx': `${g.cx}px`,
    '--cy': `${g.cy}px`,
    '--r': `${g.r}px`,
    '--disc': `${g.rings.disc}px`,
    '--node': `${g.node}px`,
    '--k': g.scale,
  } as CSSProperties

  return (
    <main
      className={`welcome welcome--${step}${g.compact ? ' welcome--compact' : ''}${leaving ? ' welcome--leaving' : ''}`}
      style={style}
    >
      <div className="welcome__brand">The Nebula</div>
      {step === 'select' && <div className="welcome__dim" aria-hidden="true" />}

      {g.compact ? (
        <>
          {core}
          <div className="welcome__below">{panel}</div>
        </>
      ) : (
        <div className="welcome__column">
          {core}
          {panel}
        </div>
      )}

      {LIBRARIES.map((lib) => {
        const p = onOrbit(g, ANGLES[lib])
        const selected = (step === 'password' || step === 'create') && name === lib
        const faded = (step === 'password' || step === 'create') && name !== lib
        const locked = step === 'create'
        return (
          <button
            key={lib}
            type="button"
            className={`lib-node${selected ? ' lib-node--selected' : ''}${faded ? ' lib-node--faded' : ''}${
              step === 'select' ? ' lib-node--focus' : ''
            }`}
            style={{ left: p.x, top: p.y }}
            onClick={() => !locked && choose(lib)}
            disabled={locked}
            aria-label={`Sign in as ${lib}`}
          >
            <span className="lib-node__circle">{lib[0]}</span>
            <span className="lib-node__label">{lib}</span>
          </button>
        )
      })}

      <p className="welcome__footer">
        {step === 'create'
          ? change
            ? 'Only you will know your new password'
            : 'You can change your password again any time from Home'
          : step === 'select' && !g.compact
            ? 'Each Library is private — select your name to sign in'
            : g.compact
              ? step === 'intro'
                ? 'A private Nebula for six readers'
                : ''
              : 'A private Nebula for six readers  ·  Sign in with your Library name'}
      </p>
    </main>
  )
}

function PasswordField(props: {
  label: string
  value: string
  onChange: (v: string) => void
  hint: string
  error?: boolean
  autoComplete: string
  autoFocus?: boolean
  placeholder?: string
}) {
  const [reveal, setReveal] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (props.autoFocus) ref.current?.focus({ preventScroll: true })
  }, [props.autoFocus])
  return (
    <label className="field">
      <span className="field__label">{props.label}</span>
      <span className={`field__box${props.error ? ' field__box--error' : ''}`}>
        <Lock size={14} strokeWidth={1.5} />
        <input
          ref={ref}
          type={reveal ? 'text' : 'password'}
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          aria-invalid={!!props.error}
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
      <span className={`field__hint${props.error ? ' field__hint--error' : ''}`}>{props.hint}</span>
    </label>
  )
}

function SignInForm({
  name,
  onSubmit,
  onSwitch,
}: {
  name: LibraryName
  onSubmit: (password: string) => Promise<string | null>
  onSwitch: () => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) return
    setBusy(true)
    setError(null)
    const err = await onSubmit(password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form className="welcome__panel welcome__form" onSubmit={submit}>
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        hint={error ?? `Only ${name} can open this Library.`}
        error={!!error}
        autoComplete="current-password"
        autoFocus
      />
      <button className="btn btn--gold btn--wide-mobile" type="submit" disabled={busy || !password}>
        {busy ? 'Opening…' : 'Enter Library'} <ArrowRight size={16} />
      </button>
      <p className="welcome__switch">
        Not {name}?{' '}
        <button type="button" className="link-btn" onClick={onSwitch}>
          Choose another name
        </button>
      </p>
    </form>
  )
}

function CreatePasswordForm({
  intro,
  onSubmit,
  secondary,
  onSecondary,
}: {
  intro: string
  onSubmit: (password: string) => Promise<string | null>
  secondary: string
  onSecondary: () => void
}) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [tried, setTried] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const tooShort = pw.length < 8
  const mismatch = confirm.length > 0 && confirm !== pw

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (tooShort || confirm !== pw) return
    setBusy(true)
    setError(null)
    const err = await onSubmit(pw)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <form className="welcome__panel welcome__form welcome__form--create" onSubmit={submit}>
      <p className="welcome__intro">{intro}</p>
      <PasswordField
        label="New password"
        value={pw}
        onChange={setPw}
        hint={error ?? (tried && tooShort ? 'Use at least 8 characters.' : 'At least 8 characters.')}
        error={!!error || (tried && tooShort)}
        autoComplete="new-password"
        autoFocus
      />
      <PasswordField
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Enter your password"
        hint={
          mismatch || (tried && confirm !== pw)
            ? 'The passwords don’t match yet.'
            : 'Type it once more so we know it matches.'
        }
        error={mismatch || (tried && confirm !== pw)}
        autoComplete="new-password"
      />
      <button className="btn btn--gold btn--wide-mobile" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save & enter'} <ArrowRight size={16} />
      </button>
      <button type="button" className="link-btn welcome__skip" onClick={onSecondary} disabled={busy}>
        {secondary}
      </button>
    </form>
  )
}

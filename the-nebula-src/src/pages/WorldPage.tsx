import type { PartialBlock } from '@blocknote/core'
import { ImageIcon, MoreHorizontal, Plus, Sparkle, Trash2, X } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BackLink, Breadcrumb } from '../components/BackLink'
import { WORLD_ICONS, WorldIcon } from '../components/WorldIcon'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { deleteWorld, updateWorld, uploadImage, type World, type WorldProperty } from '../lib/worlds'

const WorldEditor = lazy(() =>
  import('../components/WorldEditor').then((m) => ({ default: m.WorldEditor })),
)

type SaveState = 'saved' | 'saving' | 'error'

export function WorldPage() {
  const { id } = useParams()
  const { session, me } = useAuth()
  const navigate = useNavigate()
  const [world, setWorld] = useState<World | null>(null)
  const [ownerName, setOwnerName] = useState<string>('')
  const [missing, setMissing] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [iconPicker, setIconPicker] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [, tick] = useState(0)

  const pending = useRef<Partial<World>>({})
  const timer = useRef<number | undefined>(undefined)
  const coverInput = useRef<HTMLInputElement>(null)

  const canEdit = !!world && !!session && world.owner === session.user.id

  useEffect(() => {
    if (!id) return
    let active = true
    supabase
      .from('worlds')
      .select('*, owner_profile:profiles(name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) return setMissing(true)
        const { owner_profile, ...w } = data as World & { owner_profile: { name: string } | null }
        setWorld({ ...w, properties: Array.isArray(w.properties) ? w.properties : [] })
        setOwnerName(owner_profile?.name ?? '')
        setSavedAt(new Date(w.updated_at))
      })
    return () => {
      active = false
    }
  }, [id])

  // Re-render every 30s so "Saved · 2 min ago" stays current.
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000)
    return () => window.clearInterval(t)
  }, [])

  const worldId = world?.id
  const flush = useCallback(async () => {
    if (!worldId) return
    const patch = pending.current
    pending.current = {}
    if (!Object.keys(patch).length) return
    setSaveState('saving')
    try {
      await updateWorld(worldId, patch)
      setSaveState('saved')
      setSavedAt(new Date())
    } catch {
      setSaveState('error')
      pending.current = { ...patch, ...pending.current }
    }
  }, [worldId])

  // Save any unsaved edits when leaving the page.
  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current)
      void flush()
    }
  }, [flush])

  const queue = (patch: Partial<World>, immediate = false) => {
    if (!canEdit) return
    pending.current = { ...pending.current, ...patch }
    setWorld((w) => (w ? { ...w, ...patch } : w))
    setSaveState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, immediate ? 0 : 800)
  }

  const onUpload = useCallback(
    async (file: File) => {
      if (!session) throw new Error('Sign in to upload.')
      return uploadImage(session.user.id, file)
    },
    [session],
  )

  const onCover = async (file: File | undefined) => {
    if (!file) return
    setNotice(null)
    try {
      const url = await onUpload(file)
      queue({ cover_url: url }, true)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Upload failed.')
    }
  }

  const onDelete = async () => {
    if (!world) return
    const name = world.title.trim() || 'Untitled world'
    if (!window.confirm(`Delete “${name}”? This can’t be undone.`)) return
    window.clearTimeout(timer.current)
    pending.current = {}
    await deleteWorld(world.id)
    navigate(`/library/${ownerName || me}`, { replace: true })
  }

  if (missing) return <Navigate to={me ? `/library/${me}` : '/'} replace />
  if (!world) return <main className="page page--plain loading">Opening world…</main>

  const title = world.title
  const props = world.properties
  const setProps = (next: WorldProperty[]) => queue({ properties: next })

  return (
    <main className={`page page--plain world${world.cover_url ? ' world--cover' : ''}`}>
      {world.cover_url && (
        <div className="cover" style={{ backgroundImage: `url(${world.cover_url})` }}>
          {canEdit && (
            <div className="cover__actions">
              <button className="chip" onClick={() => coverInput.current?.click()}>
                Change cover
              </button>
              <button className="chip" onClick={() => queue({ cover_url: null }, true)}>
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      <header className="page-top">
        <BackLink to={`/library/${ownerName || me}`} />
        <div className="page-top__right">
          <Breadcrumb
            parts={[
              { label: 'The Library', to: `/library/${ownerName}` },
              { label: ownerName, to: `/library/${ownerName}` },
              { label: title.trim() || 'Untitled world' },
            ]}
          />
          {canEdit ? (
            <>
              <span className={`save-state save-state--${saveState}`}>
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'error'
                    ? 'Not saved · retrying on next edit'
                    : `Saved · ${timeAgo(savedAt)}`}
              </span>
              <div className="menu-wrap">
                <button
                  className="icon-btn"
                  aria-label="Page menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
                {menuOpen && (
                  <div className="menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
                    <button role="menuitem" className="menu__item menu__item--danger" onClick={onDelete}>
                      <Trash2 size={14} /> Delete world
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="save-state">Reading · {ownerName}’s world</span>
          )}
        </div>
      </header>

      <article className="world__body">
        {(world.cover_url || world.icon) && (
          <div className="page-icon-wrap">
            <button
              className="page-icon"
              disabled={!canEdit}
              onClick={() => setIconPicker((o) => !o)}
              aria-label="Change icon"
            >
              <WorldIcon name={world.icon} size={36} />
            </button>
            {iconPicker && canEdit && (
              <div className="icon-picker" role="listbox" aria-label="Choose an icon">
                {Object.keys(WORLD_ICONS).map((key) => (
                  <button
                    key={key}
                    role="option"
                    aria-selected={world.icon === key}
                    className={world.icon === key ? 'is-active' : ''}
                    onClick={() => {
                      queue({ icon: key }, true)
                      setIconPicker(false)
                    }}
                  >
                    <WorldIcon name={key} size={20} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {canEdit && (
          <div className="affordances">
            {!world.icon && (
              <button className="text-btn" onClick={() => queue({ icon: 'sparkle' }, true)}>
                <Sparkle size={14} strokeWidth={1.5} /> Add icon
              </button>
            )}
            {!world.cover_url && (
              <button className="text-btn" onClick={() => coverInput.current?.click()}>
                <ImageIcon size={14} strokeWidth={1.5} /> Add cover
              </button>
            )}
            <input
              ref={coverInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                void onCover(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        )}
        {notice && <p className="error-text">{notice}</p>}

        {canEdit ? (
          <textarea
            className="world__title"
            value={title}
            rows={1}
            placeholder="Untitled world"
            onChange={(e) => queue({ title: e.target.value })}
            onInput={(e) => autoGrow(e.currentTarget)}
            ref={(el) => {
              if (el) autoGrow(el)
            }}
          />
        ) : (
          <h1 className="world__title">{title.trim() || 'Untitled world'}</h1>
        )}

        <div className="properties">
          {props.map((p, i) => (
            <div className="property" key={i}>
              {canEdit ? (
                <>
                  <input
                    className="property__key"
                    value={p.key}
                    placeholder="Property"
                    onChange={(e) => setProps(props.map((q, j) => (j === i ? { ...q, key: e.target.value } : q)))}
                  />
                  <input
                    className="property__value"
                    value={p.value}
                    placeholder="Empty"
                    onChange={(e) =>
                      setProps(props.map((q, j) => (j === i ? { ...q, value: e.target.value } : q)))
                    }
                  />
                  <button
                    className="icon-btn property__remove"
                    aria-label="Remove property"
                    onClick={() => setProps(props.filter((_, j) => j !== i))}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="property__key">{p.key}</span>
                  <span className="property__value">{p.value}</span>
                </>
              )}
            </div>
          ))}
          {canEdit && (
            <button className="add-property" onClick={() => setProps([...props, { key: '', value: '' }])}>
              <Plus size={14} strokeWidth={1.5} /> Add a property
            </button>
          )}
        </div>

        {props.length > 0 && <hr className="world__rule" />}

        <div className="world__editor">
          <Suspense fallback={<p className="small-muted">Loading editor…</p>}>
            <WorldEditor
              key={world.id}
              initialContent={world.content}
              editable={canEdit}
              uploadFile={onUpload}
              onChange={(blocks: PartialBlock[]) => {
                pending.current = { ...pending.current, content: blocks }
                setSaveState('saving')
                window.clearTimeout(timer.current)
                timer.current = window.setTimeout(flush, 800)
              }}
            />
          </Suspense>
        </div>
      </article>
    </main>
  )
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function timeAgo(d: Date | null) {
  if (!d) return 'just now'
  const s = Math.round((Date.now() - d.getTime()) / 1000)
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  return d.toLocaleDateString()
}

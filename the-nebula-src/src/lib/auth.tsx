import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { findLibrary, signInEmail, type LibraryName } from './libraries'
import { supabase } from './supabase'

interface AuthState {
  loading: boolean
  session: Session | null
  /** The signed-in reader's Library name. */
  me: LibraryName | null
  /** True right after a reader's first sign-in, until they set or skip a new password. */
  needsPassword: boolean
  signIn: (name: LibraryName, password: string) => Promise<string | null>
  setPassword: (password: string) => Promise<string | null>
  skipPassword: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadName(userId: string): Promise<LibraryName | null> {
  const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  return findLibrary(data?.name) ?? null
}

function promptedFor(session: Session | null) {
  const meta = session?.user.user_metadata ?? {}
  return !!session && !meta.password_set && !meta.password_prompted
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<LibraryName | null>(null)

  useEffect(() => {
    let active = true
    const apply = async (s: Session | null) => {
      const name = s ? await loadName(s.user.id) : null
      if (!active) return
      setSession(s)
      setMe(name)
      setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer: Supabase recommends not awaiting other calls inside this callback.
        setTimeout(() => apply(s), 0)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (name: LibraryName, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: signInEmail(name),
      password,
    })
    if (error) {
      if (error.message === 'Invalid login credentials') return `That password doesn't open ${name}'s Library.`
      if (/not confirmed/i.test(error.message))
        return `${name}'s account isn't confirmed yet. Confirm the user in Supabase, then try again.`
      return error.message
    }
    const lib = await loadName(data.user.id)
    if (!lib) {
      await supabase.auth.signOut()
      return `${name}'s Library isn't set up yet. Run supabase/schema.sql, then try again.`
    }
    setSession(data.session)
    setMe(lib)
    return null
  }

  const setPassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true, password_prompted: true },
    })
    if (error) {
      if (/different from the old/i.test(error.message)) return 'Choose a password different from the one you were given.'
      return error.message
    }
    const { data: s } = await supabase.auth.getSession()
    setSession(s.session ?? (session && data.user ? { ...session, user: data.user } : session))
    return null
  }

  const skipPassword = async () => {
    const { data } = await supabase.auth.updateUser({ data: { password_prompted: true } })
    if (data.user && session) setSession({ ...session, user: data.user })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setMe(null)
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        me,
        needsPassword: !!me && promptedFor(session),
        signIn,
        setPassword,
        skipPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

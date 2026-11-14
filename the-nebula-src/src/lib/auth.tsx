import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { findLibrary, signInEmail, type LibraryName } from './libraries'
import { supabase } from './supabase'

interface AuthState {
  loading: boolean
  session: Session | null
  /** The signed-in reader's Library name. */
  me: LibraryName | null
  signIn: (name: LibraryName, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadName(userId: string): Promise<LibraryName | null> {
  const { data } = await supabase.from('profiles').select('name').eq('id', userId).maybeSingle()
  return findLibrary(data?.name) ?? null
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
      return error.message === 'Invalid login credentials'
        ? `That password doesn't open ${name}'s Library.`
        : error.message
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

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setMe(null)
  }

  return (
    <AuthContext.Provider value={{ loading, session, me, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

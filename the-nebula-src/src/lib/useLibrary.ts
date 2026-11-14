import { useCallback, useEffect, useState } from 'react'
import type { LibraryName } from './libraries'
import { profileIdFor, type WorldSummary } from './worlds'
import { supabase } from './supabase'

export interface LibraryData {
  ownerId: string | null
  worlds: (WorldSummary & { chapters: number })[]
  wanderers: number
}

function countHeadings(content: unknown): number {
  if (!Array.isArray(content)) return 0
  return content.filter((b) => b && typeof b === 'object' && (b as { type?: string }).type === 'heading')
    .length
}

/** Loads one Library: its owner, its worlds (newest first) and its wanderer count. */
export function useLibrary(name: LibraryName | undefined) {
  const [data, setData] = useState<LibraryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!name) return
    setError(null)
    try {
      const ownerId = await profileIdFor(name)
      if (!ownerId) {
        setData({ ownerId: null, worlds: [], wanderers: 0 })
        return
      }
      const [worldsRes, visitsRes] = await Promise.all([
        supabase
          .from('worlds')
          .select('id,title,icon,updated_at,created_at,content')
          .eq('owner', ownerId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('visits')
          .select('visitor', { count: 'exact', head: true })
          .eq('library_owner', ownerId),
      ])
      if (worldsRes.error) throw worldsRes.error
      setData({
        ownerId,
        worlds: (worldsRes.data ?? []).map(({ content, ...w }) => ({
          ...w,
          chapters: countHeadings(content),
        })),
        wanderers: visitsRes.count ?? 0,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this Library.')
    }
  }, [name])

  useEffect(() => {
    setData(null)
    load()
  }, [load])

  return { data, error, reload: load }
}

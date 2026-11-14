import type { PartialBlock } from '@blocknote/core'
import type { LibraryName } from './libraries'
import { MAX_UPLOAD_BYTES, MEDIA_BUCKET, supabase } from './supabase'

export interface WorldProperty {
  key: string
  value: string
}

export interface World {
  id: string
  owner: string
  title: string
  icon: string | null
  cover_url: string | null
  properties: WorldProperty[]
  content: PartialBlock[] | null
  template: string
  created_at: string
  updated_at: string
}

export type WorldSummary = Pick<World, 'id' | 'title' | 'icon' | 'updated_at' | 'created_at'>

/** Max circles in the orbit; Start Writing and Archive always take two. */
export const ORBIT_WORLD_SLOTS = 4

export async function profileIdFor(name: LibraryName): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('id').eq('name', name).maybeSingle()
  return data?.id ?? null
}

export async function listWorlds(ownerId: string): Promise<WorldSummary[]> {
  const { data, error } = await supabase
    .from('worlds')
    .select('id,title,icon,updated_at,created_at')
    .eq('owner', ownerId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function countWanderers(ownerId: string): Promise<number> {
  const { count } = await supabase
    .from('visits')
    .select('visitor', { count: 'exact', head: true })
    .eq('library_owner', ownerId)
  return count ?? 0
}

export async function recordVisit(ownerId: string, visitorId: string) {
  if (ownerId === visitorId) return
  await supabase
    .from('visits')
    .upsert({ library_owner: ownerId, visitor: visitorId }, { ignoreDuplicates: true })
}

export async function getWorld(id: string): Promise<World | null> {
  const { data, error } = await supabase.from('worlds').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as World | null
}

export async function createWorld(ownerId: string, template: 'blank' | 'worldbuilding') {
  const content = template === 'worldbuilding' ? WORLDBUILDING_TEMPLATE : null
  const { data, error } = await supabase
    .from('worlds')
    .insert({ owner: ownerId, template, content, icon: 'sparkle' })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateWorld(id: string, patch: Partial<Omit<World, 'id' | 'owner'>>) {
  const { error } = await supabase.from('worlds').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteWorld(id: string) {
  const { error } = await supabase.from('worlds').delete().eq('id', id)
  if (error) throw error
}

export async function uploadImage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Only images can be uploaded.')
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Images must be 2 MB or smaller.')
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}

const h = (level: 1 | 2 | 3, text: string): PartialBlock => ({
  type: 'heading',
  props: { level },
  content: text,
})
const p = (text: string): PartialBlock => ({ type: 'paragraph', content: text })
const li = (text: string): PartialBlock => ({ type: 'bulletListItem', content: text })
const ol = (text: string): PartialBlock => ({ type: 'numberedListItem', content: text })
const todo = (text: string): PartialBlock => ({ type: 'checkListItem', content: text })

/** Chey's World-Building Template. */
export const WORLDBUILDING_TEMPLATE: PartialBlock[] = [
  p('A guided structure for building a world. Replace the prompts with your own lore.'),
  h(2, 'Overview'),
  p('What is this world in one or two sentences? What makes it different?'),
  h(2, 'Characters'),
  li('Name — role, desire, fear'),
  li('Name — role, desire, fear'),
  h(2, 'Locations'),
  li('Place — what it looks like, who lives there'),
  li('Place — what it looks like, who lives there'),
  h(2, 'Factions'),
  li('Faction — what they want, who leads them, who they oppose'),
  h(2, 'Timeline'),
  ol('The beginning'),
  ol('The turning point'),
  ol('The present day'),
  h(2, 'Lore'),
  p('Myths, magic, rules of the world, things every inhabitant knows.'),
  h(2, 'Open questions'),
  todo('What still needs deciding?'),
  p(''),
]

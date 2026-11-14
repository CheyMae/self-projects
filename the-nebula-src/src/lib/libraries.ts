// The six permanent Libraries of the Nebula. Each one belongs to one reader.
export const LIBRARIES = ['Ara', 'Chey', 'Chin', 'Kosca', 'Mae', 'Otep'] as const
export type LibraryName = (typeof LIBRARIES)[number]

// Readers sign in with their Library name + password. Supabase Auth needs an
// email behind the scenes, so each name maps to a sign-in address here.
// These addresses never receive mail (example.com is reserved), which keeps
// real emails out of this public code. Create each user in the Supabase
// dashboard with exactly these addresses (see README.md).
export function signInEmail(name: LibraryName) {
  return `nebula.${name.toLowerCase()}@example.com`
}

export function findLibrary(name: string | undefined): LibraryName | undefined {
  if (!name) return undefined
  return LIBRARIES.find((l) => l.toLowerCase() === name.toLowerCase())
}

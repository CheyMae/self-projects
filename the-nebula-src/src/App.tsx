import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Cosmos } from './components/Cosmos'
import { AuthProvider, useAuth } from './lib/auth'
import { Archive } from './pages/Archive'
import { GettingStarted } from './pages/GettingStarted'
import { Home } from './pages/Home'
import { StartWriting } from './pages/StartWriting'
import { Welcome } from './pages/Welcome'
import { WorldPage } from './pages/WorldPage'

function RequireReader({ children }: { children: ReactNode }) {
  const { loading, me, needsPassword } = useAuth()
  if (loading) return <main className="page loading">Entering the Nebula…</main>
  if (!me) return <Navigate to="/" replace />
  // First visit: offer a new password before entering.
  if (needsPassword) return <Navigate to="/" replace />
  return children
}

// HashRouter keeps deep links working on GitHub Pages (no server rewrites).
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Cosmos />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/password" element={<Welcome change />} />
          <Route path="/library/:name" element={<RequireReader><Home /></RequireReader>} />
          <Route path="/library/:name/new" element={<RequireReader><StartWriting /></RequireReader>} />
          <Route path="/library/:name/archive" element={<RequireReader><Archive /></RequireReader>} />
          <Route path="/world/:id" element={<RequireReader><WorldPage /></RequireReader>} />
          <Route path="/getting-started" element={<RequireReader><GettingStarted /></RequireReader>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

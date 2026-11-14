import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BackLink({ to, label = 'Back to home' }: { to: string; label?: string }) {
  return (
    <Link to={to} className="back-link">
      <ArrowLeft size={14} strokeWidth={1.5} />
      <span>{label}</span>
    </Link>
  )
}

export function Breadcrumb({ parts }: { parts: { label: string; to?: string }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="breadcrumb__sep">/</span>}
          {p.to ? <Link to={p.to}>{p.label}</Link> : <span>{p.label}</span>}
        </span>
      ))}
    </nav>
  )
}

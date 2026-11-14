import { NavLink } from 'react-router-dom'
import { LIBRARIES } from '../lib/libraries'

export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Libraries">
      {LIBRARIES.map((name) => (
        <NavLink
          key={name}
          to={`/library/${name}`}
          className={({ isActive }) => `tab${isActive ? ' tab--active' : ''}`}
        >
          {name}
        </NavLink>
      ))}
    </nav>
  )
}

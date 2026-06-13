import { NavLink, useNavigate } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <NavLink to="/upload" className="navbar__brand">
        Soccer Trainer
      </NavLink>

      <div className="navbar__actions">
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `navbar__link${isActive ? ' navbar__link--active' : ''}`
          }
        >
          Upload
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `navbar__link${isActive ? ' navbar__link--active' : ''}`
          }
        >
          History
        </NavLink>
        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (location.pathname === '/login') return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/chat', label: 'Chat AI' },
    { path: '/favorites', label: 'Yêu thích' },
    { path: '/profile', label: 'Hồ sơ' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🍽️</span>
          <span className="navbar-title">Foođi</span>
        </Link>

        <button 
          className="hamburger-menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="navbar-link-icon">{link.icon}</span>
              <span className="navbar-link-label">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button
            className="btn btn-icon theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {isAuthenticated && (
            <div className="navbar-user">
              <span className="navbar-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
              <button className="btn btn-ghost navbar-logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

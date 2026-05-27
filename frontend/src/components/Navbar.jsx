import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/login') return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/', label: 'Trang chủ', icon: '🏠' },
    { path: '/chat', label: 'Chat AI', icon: '💬' },
    { path: '/favorites', label: 'Yêu thích', icon: '❤️' },
    { path: '/profile', label: 'Hồ sơ', icon: '👤' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🍽️</span>
          <span className="navbar-title">SmartFood</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
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

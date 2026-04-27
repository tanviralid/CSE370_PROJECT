import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Map, PlusCircle, Search, BarChart2, LogIn, LogOut, UserCircle } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, [location]); // Re-check on every route change

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Shield className="logo-icon" size={28} />
          <span>SafeCity<span className="text-accent">BD</span></span>
        </Link>
        
        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive('/')}`}>
            <Map size={18} />
            <span>Live Map</span>
          </Link>
          <Link to="/submit" className={`nav-item submit-btn`}>
            <PlusCircle size={18} />
            <span>Report Crime</span>
          </Link>
          <Link to="/track" className={`nav-item ${isActive('/track')}`}>
            <Search size={18} />
            <span>Track Status</span>
          </Link>

          {/* Role-based dashboard links */}
          {user && user.user_type === 'police' && (
            <Link to="/police" className={`nav-item ${isActive('/police')}`}>
              <BarChart2 size={18} />
              <span>Police Panel</span>
            </Link>
          )}
          {user && user.user_type === 'admin' && (
            <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
              <BarChart2 size={18} />
              <span>Admin Panel</span>
            </Link>
          )}

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 10px' }}></div>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nav-item" style={{ cursor: 'default', opacity: 0.8 }}>
                <UserCircle size={18} />
                <span style={{ fontSize: '0.85rem' }}>{user.name}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="nav-item"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className={`nav-item ${isActive('/login')}`} style={{ color: 'var(--accent)' }}>
              <LogIn size={18} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

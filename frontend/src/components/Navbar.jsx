import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Map, PlusCircle, Search, BarChart2 } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
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
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

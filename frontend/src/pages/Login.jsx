import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, LogIn } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Route based on role
      if (res.data.user.user_type === 'admin' || res.data.user.user_type === 'police') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container anim-fade-in">
      <div className="login-card glass-panel">
        <div className="login-header">
          <ShieldCheck size={48} className="icon-accent" style={{ margin: '0 auto 1rem auto' }} />
          <h2>Authorized Access</h2>
          <p>Login to SafeCity Command Center</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="glass-input" 
              placeholder="officer@police.gov.bd"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="glass-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary full-width" 
            disabled={loading}
            style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>This is a restricted government system. Unauthorized access is strictly prohibited.</p>
          <p style={{ marginTop: '0.5rem' }}>Need an account? <Link to="/signup" style={{ fontWeight: '600' }}>Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

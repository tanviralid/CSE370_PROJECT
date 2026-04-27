import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'police'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      
      // Auto login after signup
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
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
    <div className="signup-container anim-fade-in">
      <div className="signup-card glass-panel">
        <div className="signup-header">
          <UserPlus size={48} className="icon-accent" style={{ margin: '0 auto 1rem auto' }} />
          <h2>Create Account</h2>
          <p>Register for SafeCity Access</p>
        </div>

        {error && <div className="signup-error">{error}</div>}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="Officer Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="glass-input" 
              placeholder="officer@police.gov.bd"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="glass-input" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Account Role</label>
            <select 
              className="glass-input"
              value={formData.user_type}
              onChange={(e) => setFormData({...formData, user_type: e.target.value})}
            >
              <option value="police">Police Officer</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary full-width" 
            disabled={loading}
            style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} />
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div className="signup-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

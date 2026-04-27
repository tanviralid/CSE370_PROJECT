import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Activity, AlertTriangle, ShieldCheck, MapPin, Users, Trash2, Shield } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.user_type !== 'admin') {
      navigate('/login');
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [trendsRes, usersRes, areasRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/trends'),
        axios.get('http://localhost:5000/api/analytics/users'),
        axios.get('http://localhost:5000/api/analytics/areas')
      ]);

      if (trendsRes.data && trendsRes.data.districtStats) {
        setStats({
          districtStats: trendsRes.data.districtStats || [],
          crimeTypes: trendsRes.data.crimeTypes || [],
          overview: {
            total: trendsRes.data.districtStats.reduce((acc, curr) => acc + (curr.total_crimes || 0), 0),
            districts: trendsRes.data.districtStats.length,
            crimeCategories: (trendsRes.data.crimeTypes || []).length
          }
        });
      } else {
        setStats({ districtStats: [], crimeTypes: [], overview: { total: 0, districts: 0, crimeCategories: 0 } });
      }

      setUsers(usersRes.data || []);
      setAreas(areasRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setStats({ districtStats: [], crimeTypes: [], overview: { total: 0, districts: 0, crimeCategories: 0 } });
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/analytics/users/${userId}`);
      setUsers(users.filter(u => u.user_id !== userId));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleRiskChange = async (areaId, newRisk) => {
    try {
      await axios.put(`http://localhost:5000/api/analytics/area/${areaId}/risk`, { risk_level: newRisk });
      setAreas(areas.map(a => a.Area_id === areaId ? { ...a, risk_level: newRisk } : a));
    } catch (err) {
      alert('Failed to update risk level');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/analytics/reports/${reportId}`);
      fetchAllData(); // Refresh
    } catch (err) {
      alert('Failed to delete report');
    }
  };

  const handleRecalcRisk = async () => {
    try {
      await axios.get('http://localhost:5000/api/analytics/risk-levels');
      fetchAllData();
      alert('Risk levels recalculated successfully!');
    } catch (err) {
      alert('Failed to recalculate risk levels');
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading admin command center...</div>;
  }

  const getMaxStat = (arr, key) => {
    const max = Math.max(...arr.map(item => item[key] || 0));
    return max || 1;
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#ef4444';
      case 'Moderate': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="dashboard-container anim-fade-in">
      <div className="dash-header">
        <h2>System Administration</h2>
        <div className="user-badge glass-panel">
          <ShieldCheck size={16} className="text-accent" />
          <span>Admin: {user?.name || 'System'}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        {[
          { id: 'overview', label: 'Analytics Overview', icon: <BarChart size={16} /> },
          { id: 'users', label: 'User Management', icon: <Users size={16} /> },
          { id: 'areas', label: 'Area Risk Control', icon: <MapPin size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="anim-fade-in">
          <div className="kpi-grid">
            <div className="kpi-card glass-panel">
              <div className="kpi-icon pending"><Activity size={24} /></div>
              <div className="kpi-data">
                <h3>{stats.overview.total}</h3>
                <p>Total Reports</p>
              </div>
            </div>
            <div className="kpi-card glass-panel">
              <div className="kpi-icon progress"><MapPin size={24} /></div>
              <div className="kpi-data">
                <h3>{stats.overview.districts}</h3>
                <p>Active Districts</p>
              </div>
            </div>
            <div className="kpi-card glass-panel">
              <div className="kpi-icon resolved"><ShieldCheck size={24} /></div>
              <div className="kpi-data">
                <h3>{users.length}</h3>
                <p>Registered Users</p>
              </div>
            </div>
            <div className="kpi-card glass-panel border-danger">
              <div className="kpi-icon danger"><AlertTriangle size={24} /></div>
              <div className="kpi-data">
                <h3 className="text-danger">{areas.filter(a => a.risk_level === 'High').length}</h3>
                <p>High Risk Zones</p>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card glass-panel">
              <div className="chart-header">
                <MapPin size={18} className="icon-accent" />
                <h3>District Crime Saturation</h3>
              </div>
              <div className="bar-chart-container">
                {stats.districtStats.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data available</p>
                ) : (
                  stats.districtStats.map(stat => (
                    <div key={stat.district} className="bar-row">
                      <span className="bar-label">{stat.district}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill blue-gradient"
                          style={{ width: `${(stat.total_crimes / getMaxStat(stats.districtStats, 'total_crimes')) * 100}%` }}
                        ></div>
                      </div>
                      <span className="bar-value">{stat.total_crimes}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chart-card glass-panel">
              <div className="chart-header">
                <PieChart size={18} className="icon-accent" />
                <h3>Dominant Crime Vectors</h3>
              </div>
              <div className="bar-chart-container">
                {stats.crimeTypes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No data available</p>
                ) : (
                  stats.crimeTypes.map(stat => (
                    <div key={stat.crime_type} className="bar-row">
                      <span className="bar-label">{stat.crime_type}</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill purple-gradient"
                          style={{ width: `${(stat.count / getMaxStat(stats.crimeTypes, 'count')) * 100}%` }}
                        ></div>
                      </div>
                      <span className="bar-value">{stat.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="chart-card glass-panel anim-fade-in">
          <div className="chart-header">
            <Users size={18} className="icon-accent" />
            <h3>Registered Personnel ({users.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{u.user_id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: u.user_type === 'admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: u.user_type === 'admin' ? '#a78bfa' : '#60a5fa'
                      }}>
                        {u.user_type === 'admin' ? '🛡 Admin' : '👮 Police'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {u.user_id !== user.user_id && (
                        <button
                          onClick={() => handleDeleteUser(u.user_id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Area Risk Control Tab */}
      {activeTab === 'areas' && (
        <div className="chart-card glass-panel anim-fade-in">
          <div className="chart-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={18} className="icon-accent" />
              <h3>Area Risk Management ({areas.length} zones)</h3>
            </div>
            <button
              className="btn-primary"
              onClick={handleRecalcRisk}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              ⟳ Auto-Recalculate
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>District</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Thana</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Incidents</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Risk Level</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Set Risk</th>
                </tr>
              </thead>
              <tbody>
                {areas.map(area => (
                  <tr key={area.Area_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}>{area.district}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{area.thana}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{area.total_incidents || 0}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: getRiskColor(area.risk_level),
                        background: `${getRiskColor(area.risk_level)}20`
                      }}>
                        {area.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <select
                        value={area.risk_level}
                        onChange={(e) => handleRiskChange(area.Area_id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.5rem',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Low" style={{ color: 'black' }}>Low</option>
                        <option value="Moderate" style={{ color: 'black' }}>Moderate</option>
                        <option value="High" style={{ color: 'black' }}>High</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

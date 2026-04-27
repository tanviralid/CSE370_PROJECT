import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './PoliceDashboard.css';

const PoliceDashboard = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.user_type !== 'police') {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/police/reports'),
        axios.get('http://localhost:5000/api/police/stats')
      ]);
      setReports(reportsRes.data || []);
      setStats(statsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await axios.post('http://localhost:5000/api/police/verify', {
        report_id: reportId,
        status: newStatus,
        verifier_id: user.user_id
      });
      // Refresh data
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Pending': return 'pending';
      case 'In Progress': return 'in-progress';
      case 'Resolved': return 'resolved';
      case 'Rejected': return 'rejected';
      default: return '';
    }
  };

  const filteredReports = statusFilter === 'All' 
    ? reports 
    : reports.filter(r => r.status === statusFilter);

  if (loading) {
    return <div className="dashboard-loading">Loading police command center...</div>;
  }

  return (
    <div className="police-dashboard anim-fade-in">
      <div className="police-header">
        <h2><Shield size={24} className="icon-accent" /> Police Command Center</h2>
        <div className="officer-badge glass-panel">
          <Shield size={16} />
          <span>Officer: {user?.name || 'Unknown'}</span>
        </div>
      </div>

      {stats && (
        <div className="police-stats">
          <div className="stat-card glass-panel pending">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
          <div className="stat-card glass-panel progress">
            <h3>{stats.inProgress}</h3>
            <p>In Progress</p>
          </div>
          <div className="stat-card glass-panel resolved">
            <h3>{stats.resolved}</h3>
            <p>Resolved</p>
          </div>
          <div className="stat-card glass-panel rejected">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
          <div className="stat-card glass-panel total">
            <h3>{stats.total}</h3>
            <p>Total Cases</p>
          </div>
        </div>
      )}

      <div className="reports-section glass-panel">
        <h3><FileText size={20} className="icon-accent" /> Case Management</h3>
        
        <div className="filter-bar">
          {['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'].map(f => (
            <button 
              key={f}
              className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <div className="no-reports">No reports found for this filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Crime Type</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Community Votes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report.report_id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{report.tracking_id}</td>
                    <td>{report.crime_type}</td>
                    <td>{report.thana}, {report.district}</td>
                    <td>{new Date(report.incident_time).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <div className="votes-info">
                        <span className="vote-chip true">✓ {report.votes_true || 0}</span>
                        <span className="vote-chip suspicious">✕ {report.votes_suspicious || 0}</span>
                      </div>
                    </td>
                    <td>
                      <select 
                        className="action-select"
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.report_id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliceDashboard;

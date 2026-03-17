import React, { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, Clock, Vote } from 'lucide-react';
import axios from 'axios';
import './TrackStatus.css';

const TrackStatus = () => {
  const [trackingId, setTrackingId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.get(`http://localhost:5000/api/reports/${trackingId}`);
      setReport(res.data);
      setVoted(false);
      setLoading(false);
    } catch (err) {
      setError(err.response?.status === 404 ? 'No report found with this Tracking ID.' : 'Error fetching report details');
      setReport(null);
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      await axios.post(`http://localhost:5000/api/reports/${trackingId}/vote`, { vote_type: voteType });
      setVoted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'var(--warning)';
      case 'In Progress': return 'var(--primary)';
      case 'Resolved': return 'var(--accent)';
      case 'Rejected': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="track-container anim-fade-in">
      <div className="track-card glass-panel">
        <div className="track-header">
          <Search size={40} className="icon-accent mb-2" />
          <h2>Track & Verify</h2>
          <p>Enter your 10-character Tracking ID to check status or verify an incident.</p>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-box">
            <input 
              type="text" 
              placeholder="e.g. SCB-A1B2C3" 
              className="glass-input search-input"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              maxLength={15}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
          {error && <p className="error-text mt-2">{error}</p>}
        </form>

        {report && (
          <div className="report-details anim-fade-in">
            <div className="status-banner" style={{ borderLeftColor: getStatusColor(report.status) }}>
              <div className="status-title">Current Status</div>
              <div className="status-value" style={{ color: getStatusColor(report.status) }}>
                {report.status === 'In Progress' ? <Clock size={20}/> : <ShieldCheck size={20}/>}
                {report.status}
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Crime Category</span>
                <span className="value">{report.crime_type}</span>
              </div>
              <div className="detail-item">
                <span className="label">Location</span>
                <span className="value">{report.thana}, {report.district}</span>
              </div>
              <div className="detail-item">
                <span className="label">Incident Time</span>
                <span className="value">{new Date(report.incident_time).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="label">Area Risk Level</span>
                <span className={`badge risk-${report.risk_level.toLowerCase()}`}>{report.risk_level}</span>
              </div>
            </div>

            <div className="verification-section">
              <h3><Vote size={20} className="icon-accent" /> Community Verification</h3>
              <p>Did you witness this or a similar event in this area? Your vote strengthens the intel.</p>
              
              {!voted ? (
                <div className="vote-buttons">
                  <button onClick={() => handleVote('Likely True')} className="btn-vote true">
                    <ShieldCheck size={16} /> Likely True
                  </button>
                  <button onClick={() => handleVote('Needs Verification')} className="btn-vote warning">
                    <AlertCircle size={16} /> Needs Verification
                  </button>
                  <button onClick={() => handleVote('Suspicious')} className="btn-vote false">
                    <AlertCircle size={16} /> Suspicious / Fake
                  </button>
                </div>
              ) : (
                <div className="voted-state anim-fade-in">
                  <CheckCircle size={24} className="icon-success" />
                  <span>Thank you! Your verification has been added to the intelligence pool.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackStatus;

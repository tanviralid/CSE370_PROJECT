import React, { useState, useEffect } from 'react';
import { Shield, Filter, Search, Calendar, MapPin, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PublicDashboard.css';

const PublicDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/reports/data/public');
      setReports(res.data);
      setFilteredReports(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = reports;
    if (filterLocation) {
      const locLower = filterLocation.toLowerCase();
      result = result.filter(r => 
        (r.district && r.district.toLowerCase().includes(locLower)) || 
        (r.thana && r.thana.toLowerCase().includes(locLower))
      );
    }
    if (filterDate) {
      result = result.filter(r => {
        const reportDate = new Date(r.incident_time).toISOString().split('T')[0];
        return reportDate === filterDate;
      });
    }
    setFilteredReports(result);
  }, [filterLocation, filterDate, reports]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Simple visual feedback could be added here
  };

  const handleVoteClick = (trackingId) => {
    copyToClipboard(trackingId);
    // Add a small delay so they realize it was copied
    setTimeout(() => {
        navigate('/track');
    }, 300);
  };

  return (
    <div className="public-dashboard-container anim-fade-in">
      <div className="pd-header">
        <h1>Community Incident Feed</h1>
        <p>Stay informed about reported incidents in your area. Use the Tracking ID to verify or vote on incidents.</p>
      </div>

      <div className="pd-filters glass-panel">
        <div className="filter-group">
          <label><MapPin size={16}/> Filter by Location</label>
          <input 
            type="text" 
            placeholder="e.g. Dhaka, Gulshan..." 
            className="glass-input"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label><Calendar size={16}/> Filter by Date</label>
          <input 
            type="date" 
            className="glass-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="pd-reports-list">
        {loading ? (
          <div className="pd-loading">Loading incidents...</div>
        ) : filteredReports.length === 0 ? (
          <div className="pd-empty">No incidents found matching your filters.</div>
        ) : (
          filteredReports.map(report => (
            <div key={report.tracking_id} className="pd-card glass-panel">
              <div className="pd-card-header">
                <h3 className="pd-crime-type"><Shield size={18} className="icon-accent"/> {report.crime_type}</h3>
              </div>
              <div className="pd-card-body">
                <div className="pd-info">
                  <Calendar size={16} className="text-muted"/>
                  <span>{new Date(report.incident_time).toLocaleString()}</span>
                </div>
                <div className="pd-info">
                  <MapPin size={16} className="text-muted"/>
                  <span>{report.thana}, {report.district}</span>
                </div>
              </div>
              <div className="pd-card-footer">
                <div className="pd-tracking-info">
                  <span className="text-muted text-sm" style={{fontSize: '0.8rem'}}>ID:</span>
                  <span className="pd-tracking-id">{report.tracking_id}</span>
                  <button className="pd-icon-btn" onClick={() => copyToClipboard(report.tracking_id)} title="Copy ID">
                    <Copy size={14} />
                  </button>
                </div>
                <button className="btn-primary btn-sm pd-vote-btn" onClick={() => handleVoteClick(report.tracking_id)}>
                  Copy & Vote
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PublicDashboard;

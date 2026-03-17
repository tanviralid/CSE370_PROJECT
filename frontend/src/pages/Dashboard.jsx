import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, Activity, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics/trends');
        // The backend returns { districtStats, crimeTypes, monthlyTrends }
        // We will adapt it slightly to fit the UI expectation 
        // Overview can be calculated or we can just mock the highlevel numbers if they aren't provided by the backend endpoint yet
        setStats({
          districtStats: res.data.districtStats || [],
          crimeTypes: res.data.crimeTypes || [],
          overview: {
            pending: 0, // backend doesn't provide this currently, ideally it would in a real system
            inProgress: 0,
            resolved: res.data.districtStats.length > 0 ? res.data.districtStats.reduce((acc, curr) => acc + curr.total_crimes, 0) : 0, 
            highRiskAreas: 0
          }
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Securely loading intelligence database...</div>;
  }

  const getMaxStat = (arr, key) => Math.max(...arr.map(item => item[key]));

  return (
    <div className="dashboard-container anim-fade-in">
      <div className="dash-header">
        <h2>Intelligence Command Center</h2>
        <div className="user-badge glass-panel">
          <ShieldCheck size={16} className="text-accent" />
          <span>Admin Access | Police HQs</span>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon pending"><Activity size={24} /></div>
          <div className="kpi-data">
            <h3>{stats.overview.pending}</h3>
            <p>New / Pending Reports</p>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon progress"><ShieldCheck size={24} /></div>
          <div className="kpi-data">
            <h3>{stats.overview.inProgress}</h3>
            <p>Active Investigations</p>
          </div>
        </div>
        <div className="kpi-card glass-panel">
          <div className="kpi-icon resolved"><ShieldCheck size={24} /></div>
          <div className="kpi-data">
            <h3>{stats.overview.resolved}</h3>
            <p>Resolved Incidents</p>
          </div>
        </div>
        <div className="kpi-card glass-panel border-danger">
          <div className="kpi-icon danger"><AlertTriangle size={24} /></div>
          <div className="kpi-data">
            <h3 className="text-danger">{stats.overview.highRiskAreas}</h3>
            <p>High Risk Geo-Zones</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* District Distribution */}
        <div className="chart-card glass-panel">
          <div className="chart-header">
            <MapPin size={18} className="icon-accent" />
            <h3>District Crime Saturation</h3>
          </div>
          <div className="bar-chart-container">
            {stats.districtStats.map(stat => (
              <div key={stat.district} className="bar-row">
                <span className="bar-label">{stat.district}</span>
                <div className="bar-track">
                  <div 
                    className="bar-fill blue-gradient" 
                    style={{ width: `${(stat.total_crirmed / getMaxStat(stats.districtStats, 'total_crirmed')) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-value">{stat.total_crirmed}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Crime Type Distribution */}
        <div className="chart-card glass-panel">
          <div className="chart-header">
            <PieChart size={18} className="icon-accent" />
            <h3>Dominant Crime Vectors</h3>
          </div>
          <div className="bar-chart-container">
            {stats.crimeTypes.map(stat => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import axios from 'axios';
import { Filter, Activity } from 'lucide-react';
import './Home.css';

const Home = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/reports/heatmap');
        setHeatmapData(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, []);

  const getRiskColor = (risk_level) => {
    switch(risk_level) {
      case 'High': return '#ef4444'; // var(--danger)
      case 'Moderate': return '#f59e0b'; // var(--warning)
      case 'Low': return '#10b981'; // var(--accent)
      default: return '#3b82f6';
    }
  };

  return (
    <div className="home-container anim-fade-in">
      <header className="home-header">
        <div>
          <h1>SafeCity Intelligence</h1>
          <p className="subtitle">Dynamic Geographic Heat Intelligence Engine</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary glass-panel">
            <Filter size={16} /> Filters
          </button>
          <div className="status-badge glass-panel">
            <Activity className="pulse-icon" size={16} color="#10b981" />
            <span>Live System Active</span>
          </div>
        </div>
      </header>

      <div className="map-wrapper glass-panel">
        {loading ? (
          <div className="loading-state">Loading intelligence data...</div>
        ) : (
          <MapContainer 
            center={[23.6850, 90.3563]} 
            zoom={7} 
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {heatmapData.map((area) => (
              <Circle
                key={area.Area_id}
                center={[area.lat, area.lng]}
                pathOptions={{ 
                  color: getRiskColor(area.risk_level), 
                  fillColor: getRiskColor(area.risk_level), 
                  fillOpacity: 0.4
                }}
                radius={area.total_incidents * 2000 + 4000} // Dynamic radius based on incident count
                className="pulse-circle"
              >
                <Popup className="custom-popup">
                  <div className="popup-content">
                    <h3>{area.thana}, {area.district}</h3>
                    <div className="popup-stat">
                      <span>Risk Level:</span>
                      <strong style={{color: getRiskColor(area.risk_level)}}>{area.risk_level}</strong>
                    </div>
                    <div className="popup-stat">
                      <span>Total Incidents:</span>
                      <strong>{area.total_incidents}</strong>
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        )}
      </div>
      
      <div className="legend glass-panel">
        <h4>Risk Indicator</h4>
        <div className="legend-items">
          <div className="legend-item"><span className="dot high"></span> High Risk</div>
          <div className="legend-item"><span className="dot moderate"></span> Moderate Risk</div>
          <div className="legend-item"><span className="dot low"></span> Low Risk</div>
        </div>
      </div>
    </div>
  );
};

export default Home;

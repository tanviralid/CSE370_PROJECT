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
            {heatmapData.map((area) => {
              // Provide fallback coordinates if the backend doesn't supply them yet
              const districtCoordinates = {
                "Dhaka": { lat: 23.8103, lng: 90.4125 },
                "Chattogram": { lat: 22.3569, lng: 91.7832 },
                "Sylhet": { lat: 24.8949, lng: 91.8687 },
                "Rajshahi": { lat: 24.3745, lng: 88.6042 },
                "Khulna": { lat: 22.8456, lng: 89.5403 },
                "Barishal": { lat: 22.7010, lng: 90.3535 },
                "Rangpur": { lat: 25.7439, lng: 89.2752 },
                "Mymensingh": { lat: 24.7471, lng: 90.4203 },
                "Gazipur": { lat: 23.9999, lng: 90.4203 },
                "Narayanganj": { lat: 23.6238, lng: 90.5000 },
                "Cox's Bazar": { lat: 21.4272, lng: 92.0058 },
                "Moulvibazar": { lat: 24.4829, lng: 91.7774 },
                "Bogra": { lat: 24.8465, lng: 89.3778 },
                "Jessore": { lat: 23.1634, lng: 89.2182 },
                "Dinajpur": { lat: 25.6217, lng: 88.6358 }
              };
              
              // Get base district coordinate or default to center of Bangladesh
              const baseCoords = districtCoordinates[area.district] || { lat: 23.6850, lng: 90.3563 };
              
              // Add slight random offset based on Area_id so dots in same district spread out
              const lat = area.lat || baseCoords.lat + (Math.sin(area.Area_id * 10) * 0.05);
              const lng = area.lng || baseCoords.lng + (Math.cos(area.Area_id * 10) * 0.05);
              
              return (
                <Circle
                  key={area.Area_id}
                  center={[lat, lng]}
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
              );
            })}
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

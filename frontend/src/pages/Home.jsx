import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import axios from 'axios';
import { Filter, Activity } from 'lucide-react';
import './Home.css';

const Home = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('All');

  const coordinateMap = {
    "Dhaka": { lat: 23.8103, lng: 90.4125 },
    "Gazipur": { lat: 24.0023, lng: 90.4264 },
    "Narayanganj": { lat: 23.6238, lng: 90.5000 },
    "Chattogram": { lat: 22.3569, lng: 91.7832 },
    "Cox's Bazar": { lat: 21.4272, lng: 92.0058 },
    "Sylhet": { lat: 24.8949, lng: 91.8687 },
    "Moulvibazar": { lat: 24.4843, lng: 91.7685 },
    "Rajshahi": { lat: 24.3636, lng: 88.6241 },
    "Bogra": { lat: 24.8465, lng: 89.3778 },
    "Khulna": { lat: 22.8456, lng: 89.5403 },
    "Jessore": { lat: 23.1664, lng: 89.2082 },
    "Barishal": { lat: 22.7010, lng: 90.3535 },
    "Rangpur": { lat: 25.7439, lng: 89.2752 },
    "Dinajpur": { lat: 25.6217, lng: 88.6355 },
    "Mymensingh": { lat: 24.7471, lng: 90.4203 }
  };

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/reports/data/heatmap');
        if (Array.isArray(res.data)) {
          const individualIncidents = [];
          res.data.forEach(area => {
            const coords = coordinateMap[area.district] || { lat: 23.6850, lng: 90.3563 };
            const incidentsCount = area.total_incidents || 0;
            for (let i = 0; i < incidentsCount; i++) {
              individualIncidents.push({
                ...area,
                incident_id: `${area.Area_id}-${i}`,
                lat: coords.lat + (Math.random() - 0.5) * 0.05,
                lng: coords.lng + (Math.random() - 0.5) * 0.05
              });
            }
          });
          setHeatmapData(individualIncidents);
        } else {
          setHeatmapData([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Heatmap fetch error:", err);
        setHeatmapData([]);
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, []);

  const getRiskColor = (risk_level) => {
    switch (risk_level) {
      case 'High': return '#ef4444'; // var(--danger)
      case 'Moderate': return '#f59e0b'; // var(--warning)
      case 'Low': return '#10b981'; // var(--accent)
      default: return '#3b82f6';
    }
  };

  const createRiskIcon = (risk_level) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${getRiskColor(risk_level)}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${getRiskColor(risk_level)};"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const createClusterCustomIcon = function (cluster) {
    const markers = cluster.getAllChildMarkers();
    let hasHigh = false;
    let hasModerate = false;
    
    markers.forEach(m => {
       const risk = m.options.riskLevel;
       if (risk === 'High') hasHigh = true;
       if (risk === 'Moderate') hasModerate = true;
    });
    
    const clusterRisk = hasHigh ? 'High' : (hasModerate ? 'Moderate' : 'Low');
    const color = getRiskColor(clusterRisk);

    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); box-shadow: 0 0 15px ${color}; opacity: 0.85; display: flex; justify-content: center; align-items: center;"></div>`,
      className: 'custom-cluster-icon',
      iconSize: L.point(30, 30, true),
    });
  };

  return (
    <div className="home-container anim-fade-in">
      <header className="home-header">
        <div>
          <h1>SafeCity Intelligence</h1>
          <p className="subtitle">Dynamic Geographic Heat Intelligence Engine</p>
        </div>
        <div className="header-actions">
          <select
            className="btn-secondary glass-panel"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            <option value="All" style={{ color: 'black' }}>All Risks</option>
            <option value="High" style={{ color: 'black' }}>High Risk</option>
            <option value="Moderate" style={{ color: 'black' }}>Moderate Risk</option>
            <option value="Low" style={{ color: 'black' }}>Low Risk</option>
          </select>
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
            <MarkerClusterGroup
              chunkedLoading
              iconCreateFunction={createClusterCustomIcon}
              maxClusterRadius={60}
            >
              {heatmapData.filter(incident => riskFilter === 'All' || incident.risk_level === riskFilter).map((incident) => (
                <Marker
                  key={incident.incident_id}
                  position={[incident.lat, incident.lng]}
                  icon={createRiskIcon(incident.risk_level)}
                  riskLevel={incident.risk_level}
                >
                  <Popup className="custom-popup">
                    <div className="popup-content">
                      <h3>{incident.thana}, {incident.district}</h3>
                      <div className="popup-stat">
                        <span>Risk Level:</span>
                        <strong style={{ color: getRiskColor(incident.risk_level) }}>
                          {incident.risk_level}
                        </strong>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
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

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SubmitReport from './pages/SubmitReport';
import TrackStatus from './pages/TrackStatus';
import Dashboard from './pages/Dashboard';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitReport />} />
            <Route path="/track" element={<TrackStatus />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

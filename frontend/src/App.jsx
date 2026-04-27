import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SubmitReport from './pages/SubmitReport';
import TrackStatus from './pages/TrackStatus';
import Dashboard from './pages/Dashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
            <Route path="/police" element={<PoliceDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

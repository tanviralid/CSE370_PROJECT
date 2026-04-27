import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, MapPin, Clock, Camera, CheckCircle, CalendarDays } from "lucide-react";
import axios from "axios";
import "./SubmitReport.css";

const locationData = {
  "Dhaka": {
    "Dhaka": ["Gulshan", "Dhanmondi", "Mirpur", "Uttara", "Mohammadpur", "Badda", "Tejgaon", "Banani"],
    "Gazipur": ["Tongi", "Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur"],
    "Narayanganj": ["Narayanganj Sadar", "Fatullah", "Rupganj", "Sonargaon"]
  },
  "Chattogram": {
    "Chattogram": ["Kotwali", "Panchlaish", "Pahartali", "Halishahar", "Double Mooring"],
    "Cox's Bazar": ["Cox's Bazar Sadar", "Teknaf", "Ukhia", "Ramu"]
  },
  "Sylhet": {
    "Sylhet": ["Kotwali", "Jalalabad", "Dakshin Surma", "Airport", "Companyganj"],
    "Moulvibazar": ["Moulvibazar Sadar", "Kulaura", "Rajnagar"]
  },
  "Rajshahi": {
    "Rajshahi": ["Boalia", "Rajpara", "Motihar", "Shah Makhdum"],
    "Bogra": ["Bogra Sadar", "Shibganj", "Sherpur"]
  },
  "Khulna": {
    "Khulna": ["Khulna Sadar", "Sonadanga", "Khalishpur", "Daulatpur"],
    "Jessore": ["Jessore Sadar", "Jhikargacha", "Abhaynagar"]
  },
  "Barishal": {
    "Barishal": ["Barishal Sadar", "Bakerganj", "Babuganj", "Muladi"]
  },
  "Rangpur": {
    "Rangpur": ["Rangpur Sadar", "Badarganj", "Mithapukur", "Pirganj"],
    "Dinajpur": ["Dinajpur Sadar", "Birganj", "Ghoraghat"]
  },
  "Mymensingh": {
    "Mymensingh": ["Mymensingh Sadar", "Muktagacha", "Bhaluka", "Trishal"]
  }
};

const SubmitReport = () => {
  const [step, setStep] = useState(1);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  
  const [formData, setFormData] = useState({
    crime_type: "",
    victim_witness: "Anonymous",
    district: "",
    thana: "",
    area_id: 1, // Defaulting to 1 for demo purposes
    incident_time: "",
  });

  const [trackingId, setTrackingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const navigate = useNavigate();

  const crimeTypes = [
    "Theft/Robbery", "Harassment", "Drug Activity", "Cybercrime",
    "Vandalism", "Domestic Violence", "Extortion", "Other"
  ];

  // Derived arrays based on selections
  const availableDistricts = selectedDivision ? Object.keys(locationData[selectedDivision]) : [];
  const availableThanas = (selectedDivision && formData.district && locationData[selectedDivision][formData.district]) 
    ? locationData[selectedDivision][formData.district] 
    : [];

  const handleDivisionChange = (e) => {
    setSelectedDivision(e.target.value);
    setFormData({ ...formData, district: "", thana: "" });
  };

  const handleDistrictChange = (e) => {
    setFormData({ ...formData, district: e.target.value, thana: "" });
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const currentDateStr = `${yyyy}-${mm}-${dd}`;
    
    if (incidentDate > currentDateStr) {
      alert("You cannot select a date in the future.");
      setIsSubmitting(false);
      return;
    }

    if (incidentDate === currentDateStr) {
      const hh = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hh}:${min}`;
      if (incidentTime > currentTimeStr) {
        alert("You cannot select a time in the future for today.");
        setIsSubmitting(false);
        return;
      }
    }

    // Combine date and time for MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    const finalIncidentTime = `${incidentDate} ${incidentTime}:00`;
    const submissionData = { ...formData, incident_time: finalIncidentTime };

    try {
      const res = await axios.post('http://localhost:5000/api/reports', submissionData);
      setTrackingId(res.data.tracking_id);
      setIsSubmitting(false);
      setStep(4);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert('Failed to submit report. Please check your connection or try again. Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayDate = `${yyyy}-${mm}-${dd}`;
  
  const hh = String(today.getHours()).padStart(2, '0');
  const min = String(today.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${min}`;

  return (
    <div className="submit-container anim-fade-in">
      <div className="submit-card glass-panel">
        <div className="form-header">
          <h2>Secure Anonymous Reporting</h2>
          <p>Your identity remains completely protected. No personal information is stored.</p>
          
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? "active" : ""}`}>1</div>
            <div className={`progress-line ${step >= 2 ? "active" : ""}`}></div>
            <div className={`progress-step ${step >= 2 ? "active" : ""}`}>2</div>
            <div className={`progress-line ${step >= 3 ? "active" : ""}`}></div>
            <div className={`progress-step ${step >= 3 ? "active" : ""}`}>3</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          {/* Step 1: Crime details */}
          {step === 1 && (
            <div className="form-step anim-fade-in">
              <h3><ShieldAlert size={20} className="icon-accent" /> Incident Details</h3>
              
              <div className="form-group">
                <label>What happened?</label>
                <div className="crime-grid">
                  {crimeTypes.map(crime => (
                    <div 
                      key={crime} 
                      className={`crime-card ${formData.crime_type === crime ? "selected" : ""}`}
                      onClick={() => setFormData({ ...formData, crime_type: crime })}
                    >
                      {crime}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group inline-radio">
                <label>Your Involvement</label>
                <div className="radio-group">
                  {["Anonymous", "Victim", "Witness"].map(type => (
                    <label key={type} className="radio-label">
                      <input 
                        type="radio" 
                        name="victim_witness" 
                        value={type}
                        checked={formData.victim_witness === type}
                        onChange={(e) => setFormData({ ...formData, victim_witness: e.target.value })}
                      />
                      <span className="radio-custom"></span>
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="button" 
                className={`btn-primary full-width ${!formData.crime_type ? 'disabled-btn' : ''}`}
                onClick={handleNext}
                disabled={!formData.crime_type}
              >
                Continue to Location
              </button>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="form-step anim-fade-in">
              <h3><MapPin size={20} className="icon-accent" /> Location Select</h3>
              
              <div className="form-group">
                <label>Division</label>
                <select 
                  className="glass-input"
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                >
                  <option value="">Select Division</option>
                  {Object.keys(locationData).map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div className="form-group split">
                <div>
                  <label>District / Zila</label>
                  <select 
                    className="glass-input"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    disabled={!selectedDivision}
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Thana / Upazila</label>
                  <select 
                    className="glass-input"
                    value={formData.thana}
                    onChange={(e) => setFormData({ ...formData, thana: e.target.value })}
                    disabled={!formData.district}
                  >
                    <option value="">Select Thana</option>
                    {availableThanas.map(th => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h3><Clock size={20} className="icon-accent mt-4" /> Incident Timing</h3>
              <div className="form-group split">
                <div>
                  <label><CalendarDays size={16} /> Date</label>
                  <input 
                    type="date" 
                    className="glass-input"
                    value={incidentDate}
                    max={todayDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </div>
                <div>
                  <label><Clock size={16} /> Time</label>
                  <input 
                    type="time" 
                    className="glass-input"
                    value={incidentTime}
                    max={incidentDate === todayDate ? currentTime : undefined}
                    onChange={(e) => setIncidentTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="btn-group">
                <button type="button" className="btn-secondary" onClick={handlePrev}>Back</button>
                <button 
                  type="button" 
                  className={`btn-primary ${(!formData.district || !formData.thana || !incidentDate || !incidentTime) ? "disabled-btn" : ""}`}
                  onClick={handleNext}
                  disabled={!formData.district || !formData.thana || !incidentDate || !incidentTime}
                >
                  Continue to Evidence
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Evidence & Submit */}
          {step === 3 && (
            <div className="form-step anim-fade-in">
              <h3><Camera size={20} className="icon-accent" /> Optional Evidence</h3>
              
              <div className="upload-area">
                <Camera size={40} className="text-muted" />
                <p>Upload photos or videos (Optional)</p>
                <span className="text-muted small">Max file size 10MB</span>
                <input 
                  type="file" 
                  className="file-hidden" 
                  id="file-upload" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFileName(e.target.files[0].name);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="btn-secondary mt-2 border-dashed"
                  style={{ cursor: "pointer" }}
                >
                  {selectedFileName ? "Change File" : "Select Files"}
                </label>
                {selectedFileName && (
                  <div style={{ marginTop: "0.5rem", color: "var(--accent)", fontSize: "0.9rem", fontWeight: "600" }}>
                    Selected: {selectedFileName}
                  </div>
                )}
              </div>

              <div className="warning-box">
                <ShieldAlert size={20} className="text-warning" />
                <p>
                  By submitting, you agree that the information is accurate.
                  False reporting may negatively impact community intelligence.
                </p>
              </div>

              <div className="btn-group">
                <button type="button" className="btn-secondary" onClick={handlePrev}>Back</button>
                <button 
                  type="submit" 
                  className="btn-primary submit-pulse" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Securing Report..." : "Submit Anonymously"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="form-step success-step anim-fade-in">
              <CheckCircle size={64} className="icon-success mb-2" />
              <h2>Report Secured</h2>
              <p>Your incident has been securely logged into the Geographic Heat Engine.</p>
              
              <div className="tracking-box">
                <span>Your Secure Tracking ID</span>
                <div className="tracking-id">{trackingId}</div>
                <p className="small text-muted mt-2">Save this ID to track updates. It cannot be recovered.</p>
              </div>

              <button type="button" className="btn-primary mt-2" onClick={() => navigate("/track")}>
                Track Status Now
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitReport;

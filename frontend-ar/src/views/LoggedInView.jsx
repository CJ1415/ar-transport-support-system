import FaultList from "../components/FaultList";
import { useState, useEffect } from "react";
import AnalyticsPanel from "./AnalyticsPanel";

function LoggedInView({ faults, refreshFaults, logout, role, theme, toggleTheme, onOpenAR, onOpenToolCheck }) {

  // ── FIXED PERMISSIONS ──────────────────────────────────────────────────────
  // Convert role to lowercase so it doesn't matter if it's "Admin" or "admin"
  const normalizedRole = role ? role.toLowerCase() : "";

  const isAdmin = normalizedRole === 'admin';
  const isEngineer = normalizedRole === 'engineer';
  const isSupervisor = normalizedRole === 'supervisor';

  // Permissions mapping
  const canCompleteFault = isAdmin || isEngineer || isSupervisor;
  const canDeleteFault = isAdmin;
  // ──────────────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState("faults");
  const [showReportForm, setShowReportForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);

  const [locations, setLocations] = useState([]);
  const [severity, setSeverity] = useState("");
  const [location_id, setLocation_id] = useState("");
  const [fault_type, setFault_type] = useState("");
  const [asset_class, setAsset_class] = useState("");

  const ASSET_CLASSES = ['Civil', 'M&E', 'Track', 'Signage'];
  const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/faults/locations", {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);

  const handleSubmit = async () => {
    const token = sessionStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/api/faults/report", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ location_id: parseInt(location_id), fault_type, severity, asset_class })
      });
      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || error.message}`);
        return;
      }
      if (typeof refreshFaults === 'function') refreshFaults();
      setShowReportForm(false);
      setLocation_id(""); setFault_type(""); setSeverity(""); setAsset_class("");
      alert("Fault reported successfully!");
    } catch (err) {
      console.error("Failed to submit fault:", err);
      alert("Failed to submit fault");
    }
  };

  const completeFault = async (faultId) => {
    const token = sessionStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3000/api/faults/${faultId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Closed' })
      });
      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || error.message}`);
        return;
      }
      if (typeof refreshFaults === 'function') refreshFaults();
    } catch (err) {
      console.error("Failed to complete fault:", err);
      alert("Failed to complete fault");
    }
  };

  const deleteFault = async (faultId) => {
    const token = sessionStorage.getItem("token");
    if (!window.confirm("Delete this fault permanently?")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/faults/${faultId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || error.message}`);
        return;
      }
      if (typeof refreshFaults === 'function') refreshFaults();
    } catch (err) {
      console.error("Failed to delete fault:", err);
      alert("Failed to delete fault");
    }
  };

  const uncompletedFaults = faults.filter((fault) => fault.status !== 'Closed');
  const completedFaults = faults.filter((fault) => fault.status === 'Closed');

  return (
    <div className="logged-in-container">

      <div className="dashboard-header">
        <button
          className='theme-btn theme-toggle'
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          Switch Theme
        </button>

        <div className="dashboard-titles">
          <p className="eyebrow">Civil Engineering AR Support</p>
          <h2>{isAdmin ? 'Admin Fault Management Dashboard' : 'Staff Fault Management Dashboard'}</h2>
          <p className="intro">
            Review active infrastructure faults and submit new reports from the tunnel network.
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="logout" onClick={logout}>Log Out</button>
          <button
            className="tool-check-btn"
            onClick={onOpenToolCheck}
            style={{
              background: "#f59e0b", color: "#000", border: "none",
              padding: "8px 16px", fontWeight: "bold", cursor: "pointer",
              fontFamily: "inherit", fontSize: "inherit", marginRight: 8,
            }}
          >
            🧰 Tool Check
          </button>
          <button className="report-fault" onClick={() => setShowReportForm(true)}>
            Report New Fault
          </button>
        </div>
      </div>

      <div className="status-panel">
        <div className="stats-card">
          <span className="card-label">Total faults</span>
          <strong>{faults.length}</strong>
        </div>
        <div className="stats-card">
          <span className="card-label">High / Critical</span>
          <strong>{faults.filter(f => f.severity === 'High' || f.severity === 'Critical').length}</strong>
        </div>
        <div className="stats-card">
          <span className="card-label">Open status</span>
          <strong>{faults.filter(f => f.status === 'Open').length}</strong>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar" style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
        <button
          className={`tab-btn ${activeTab === 'faults' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('faults')}
          style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'faults' ? 'var(--primary-blue)' : 'var(--comp-bg)', color: activeTab === 'faults' ? '#fff' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
        >
          Faults
        </button>
        {/* Updated Tab check to match normalizedRole */}
        {(isAdmin || isSupervisor) && (
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', background: activeTab === 'analytics' ? 'var(--primary-blue)' : 'var(--comp-bg)', color: activeTab === 'analytics' ? '#fff' : 'var(--text-main)', border: '1px solid var(--card-border)' }}
          >
            Analytics & ML Predictions
          </button>
        )}
      </div>

      {/* Tab Content: Faults */}
      {activeTab === 'faults' && (
        <>
          <div className="fault-sections">
            <section className="fault-section">
              <div className="section-heading">
                <h3>Open & In-Progress Faults</h3>
                <span>{uncompletedFaults.length} items</span>
              </div>
              <FaultList
                faults={uncompletedFaults}
                onSelectFault={(fault) => {
                  setSelectedFault(fault);
                  setShowViewModal(true);
                }}
                onCompleteFault={canCompleteFault ? (fault) => completeFault(fault.id) : null}
                onDeleteFault={canDeleteFault ? (fault) => deleteFault(fault.id) : null}
                canComplete={canCompleteFault}
                canDelete={canDeleteFault}
              />
            </section>

            <section className="fault-section completed">
              <div className="section-heading">
                <h3>Completed Faults</h3>
                <span>{completedFaults.length} items</span>
              </div>
              <FaultList
                faults={completedFaults}
                onSelectFault={(fault) => {
                  setSelectedFault(fault);
                  setShowViewModal(true);
                }}
                onCompleteFault={null}
                onDeleteFault={canDeleteFault ? (fault) => deleteFault(fault.id) : null}
                canComplete={false}
                canDelete={canDeleteFault}
              />
            </section>
          </div>
          <div className="dashboard-actions ar-button-row">
            <button className="ar-button" onClick={onOpenAR}>
              Open AR View
            </button>
          </div>
        </>
      )}

      {/* Tab Content: Analytics */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <AnalyticsPanel />
        </div>
      )}

      {/* Report Fault Modal (Remains the same) */}
      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Report New Fault</h3>
            <p className="modal-description">Capture the location, asset class, and severity for the issue.</p>

            <div className="modal-form-group">
              <label>Location</label>
              <select value={location_id} onChange={(e) => setLocation_id(e.target.value)}>
                <option value="" disabled>Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label>Fault Type</label>
              <input
                placeholder="e.g., Crack, Drainage Blockage"
                value={fault_type}
                onChange={(e) => setFault_type(e.target.value)}
              />
            </div>

            <div className="modal-form-group split-grid">
              <div>
                <label>Asset Class</label>
                <select value={asset_class} onChange={(e) => setAsset_class(e.target.value)}>
                  <option value="" disabled>Select Asset Class</option>
                  {ASSET_CLASSES.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
                </select>
              </div>
              <div>
                <label>Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="" disabled>Select Severity</option>
                  {SEVERITY_LEVELS.map((sev) => (<option key={sev} value={sev}>{sev}</option>))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowReportForm(false)}>Cancel</button>
              <button onClick={() => handleSubmit()}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* View Fault Modal (Remains the same) */}
      {showViewModal && selectedFault && (
        <div className="modal-overlay">
          <div className="modal-box view-modal">
            <h3>Fault Details</h3>
            <p className="modal-description">Review the selected fault and launch the AR experience if needed.</p>

            <div className="view-details-grid">
              <div><span className="view-label">Location</span><p>{selectedFault.location}</p></div>
              <div><span className="view-label">Type</span><p>{selectedFault.type}</p></div>
              <div><span className="view-label">Asset Class</span><p>{selectedFault.asset_class || 'Civil'}</p></div>
              <div><span className="view-label">Severity</span><p>{selectedFault.severity}</p></div>
              <div><span className="view-label">Status</span><p>{selectedFault.status}</p></div>
              <div>
                <span className="view-label">Detected</span>
                <p>{selectedFault.detected_at ? selectedFault.detected_at.split(' ')[0] : 'N/A'}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowViewModal(false)}>Close</button>
              <button className="ar-button" onClick={() => { setShowViewModal(false); onOpenAR(); }}>
                Open AR View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default LoggedInView;
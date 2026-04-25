import FaultItem from "../components/FaultItem";
import { useState } from "react";

function LoggedInView({ faults, logout }) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [severity, setSeverity] = useState("");

  return (
    <div className="fault-list">
      <h2>Active Transport Faults</h2>

      <ul>
        {faults.length > 0 ? (
          faults.map((fault) => (
            <FaultItem key={fault.id} fault={fault} />
          ))
        ) : (
          <p>No faults found in the system</p>
        )}
      </ul>

      <div className="fault-footer">
        <button className="logout" onClick={logout}>
          Log Out
        </button>

        <button
          className="report-fault"
          onClick={() => setShowReportForm(prev => !prev)}
        >
          Report New Fault
        </button>
      </div>

      {showReportForm && (
        <div className="modal-overlay">
          <div className="modal-box">

            <h3>Report New Fault</h3>

            <input placeholder="Location" />
            <input placeholder="Type" />

            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value ="" disabled>
                  Select Severity Level
              </option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Very High</option>
            </select>

            <div className="modal-actions">
                <button onClick={() => setShowReportForm(false)}>
                    Cancel
                </button>

                <button onClick={() => console.log("Submit Fault")}>
                    Submit
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default LoggedInView;
import ViewButton from "./ViewButton";

const severityColors = {
  Critical: "#d32f2f",
  High: "#f57c00",
  Medium: "#f9a825",
  Low: "#2e7d32",
  None: "#9e9e9e"
};

function FaultItem({ fault, onSelect, onComplete, onDelete }) {
  return (
    <li className="fault-item">
      <div className="fault-card-header">
        <div>
          <span className="asset-chip">{fault.asset_class || 'Infrastructure'}</span>
          <strong className="location-name">{fault.location}</strong>
        </div>
        <span className={`status-pill status-${fault.status?.toLowerCase().replace(/\s/g, '-')}`}>
          {fault.status || 'Open'}
        </span>
      </div>

      <div className="fault-card-body">
        <div className="fault-meta">
          <div className="meta-row">
            <span className="meta-label">Type:</span>
            <span>{fault.type}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Severity:</span>
            <span style={{ color: severityColors[fault.severity] || '#ffffff', fontWeight: 600 }}>
              {fault.severity}
            </span>
          </div>
        </div>
        <div className="fault-meta">
          <div className="meta-row">
            <span className="meta-label">Detected:</span>
            <span>{fault.detected_at ? fault.detected_at.split(' ')[0] : 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="fault-card-footer">
        <ViewButton label="View" onClick={onSelect} />
        <button
          className="complete-button"
          onClick={onComplete}
          disabled={fault.status === 'Closed'}
        >
          {fault.status === 'Closed' ? 'Completed' : 'Complete'}
        </button>
        <button className="delete-button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default FaultItem;
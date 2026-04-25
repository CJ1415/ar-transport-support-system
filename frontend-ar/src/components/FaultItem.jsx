  // values for the color coding of fault severity
  const severityColors = {
  "Very High": "#ff0000",
  "High": "#ff6600",
  "Medium": "#ffcc00",
  "Low": "#00ff00",
  "None": "#ffffff"
};

 // displays faults
function FaultItem({ fault }) {
  return (
    <li key={fault.id} className="fault-item">
      <strong className="location-name">{fault.location}</strong>
      <span>Type: {fault.type}</span> |
      <span style={{
        color: severityColors[fault.severity] || "white",
        fontWeight: 'bold'
      }}> Severity: {fault.severity} </span>
    </li>
  );
}

export default FaultItem;
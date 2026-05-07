import ViewButton from "./ViewButton";

// values for the color coding of fault severity
const severityColors = {
  "Critical": "#ff0000",
  "High": "#ff6600",
  "Medium": "#ffcc00",
  "Low": "#00ff00",
};

 // displays faults
function FaultItem({ fault }) {
  return (
    <li key={fault.id} className="fault-item">
      <div style = {{display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <div>
            <strong className="location-name">{fault.location}</strong>
            <div>Type: {fault.type}</div>
            <span style={{
                color: severityColors[fault.severity] || "white",
                fontWeight: 'bold'
            }}> Severity: {fault.severity}
            </span>
        </div>

        <ViewButton label="View" onClick ={() => console.log(fault.id)} />

      </div>

    </li>
  );
}

export default FaultItem;
import ViewButton from "./ViewButton";

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

  const handleReport = async () => {
    await fetch('http://localhost:3000/api/faults/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fault)
    });
  };

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
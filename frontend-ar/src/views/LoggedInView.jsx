import FaultItem from "../components/FaultItem";

function LoggedInView({ faults, logout, severityColors }) {
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

      <button
        className="logout"
        onClick={logout}
      >
        Log Out
      </button>
    </div>
  );
}

export default LoggedInView;
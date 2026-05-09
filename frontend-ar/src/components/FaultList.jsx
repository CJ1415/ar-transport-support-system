import FaultItem from "./FaultItem";

function FaultList({ faults, onSelectFault, onCompleteFault, onDeleteFault }) {
  return (
    <ul>
      {faults.length > 0 ? (
        faults.map((fault) => (
          <FaultItem
            key={fault.id}
            fault={fault}
            onSelect={() => onSelectFault && onSelectFault(fault)}
            onComplete={() => onCompleteFault && onCompleteFault(fault)}
            onDelete={() => onDeleteFault && onDeleteFault(fault)}
          />
        ))
      ) : (
        <p>No faults found in the system</p>
      )}
    </ul>
  );
}

export default FaultList;
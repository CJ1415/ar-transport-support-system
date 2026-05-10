import FaultItem from "./FaultItem";

function FaultList({ faults, onSelectFault, onCompleteFault, onDeleteFault, canComplete, canDelete }) {
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
            canComplete={canComplete}
            canDelete={canDelete}
          />
        ))
      ) : (
        <p>No faults found in the system</p>
      )}
    </ul>
  );
}

export default FaultList;
function ViewButton ({ label, onClick}) {
    return (
        <button className="view-button" onClick={onClick}>
            {label}
            </button>
            );
        }

export default ViewButton;
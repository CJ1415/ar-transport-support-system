import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const SEVERITY_COLOURS = {
    Critical: "#dc2626",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#22c55e"
};

function AnalyticsPanel() {
    const [severityData, setSeverityData] = useState([]);
    const [faultTypeData, setFaultTypeData] = useState([]);
    const [toolData, setToolData] = useState([]);
    const [sessionData, setSessionData] = useState([]);
    const [auditData, setAuditData] = useState([]);
    const [mlData, setMlData] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        const fetchSeverityBreakdown = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/severity-breakdown", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setSeverityData(data);
            } catch (err) {
                console.error("Failed to fetch severity breakdown:", err);
            }
        };

        const fetchFaultTypes = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/fault-types", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setFaultTypeData(data);
            } catch (err) {
                console.error("Failed to fetch fault types:", err);
            }
        };

        const fetchToolStatus = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/tool-status", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setToolData(data);
            } catch (err) {
                console.error("Failed to fetch tool status:", err);
            }
        };

        const fetchActiveSessions = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/active-sessions", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setSessionData(data);
            } catch (err) {
                console.error("Failed to fetch active sessions:", err);
            }
        };

        const fetchAuditLog = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/audit-log", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setAuditData(data);
            } catch (err) {
                console.error("Failed to fetch audit log:", err);
            }
        };

        const fetchMlPredictions = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/analytics/ml-predictions", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                setMlData(data);
            } catch (err) {
                console.error("Failed to fetch ML predictions:", err);
            }
        };

        fetchSeverityBreakdown();
        fetchFaultTypes();
        fetchToolStatus();
        fetchActiveSessions();
        fetchAuditLog();
        fetchMlPredictions();
    }, []);

    return (
        <div className="analytics-panel">
            <h3>Analytics Overview</h3>

            {/* Severity Breakdown Chart */}
            <div className="chart-card">
                <h4>Fault Severity Breakdown</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={severityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="severity" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count">
                            {severityData.map((entry) => (
                                <Cell
                                    key={entry.severity}
                                    fill={SEVERITY_COLOURS[entry.severity] || "#6b7280"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Fault Type Breakdown Chart */}
            <div className="chart-card">
                <h4>Fault Type Breakdown</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={faultTypeData}
                            dataKey="count"
                            nameKey="fault_type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ fault_type, count }) => `${fault_type}: ${count}`}
                        >
                            {faultTypeData.map((entry, index) => (
                                <Cell
                                    key={entry.fault_type}
                                    fill={['#6366f1', '#06b6d4', '#f97316', '#22c55e', '#ec4899', '#eab308', '#dc2626'][index % 7]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Tool Tracking */}
            <div className="chart-card">
                <h4>Tool Tracking</h4>
                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>Tool</th>
                            <th>Category</th>
                            <th>RFID</th>
                            <th>Status</th>
                            <th>Calibration Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {toolData.map((tool) => (
                            <tr key={tool.id}>
                                <td>{tool.name}</td>
                                <td>{tool.category}</td>
                                <td>{tool.rfid_tag}</td>
                                <td>
                                    <span className={`status-badge ${tool.last_action === 'Check out' ? 'badge-out' : 'badge-in'}`}>
                                        {tool.last_action === 'Check out' ? 'Checked Out' : 'Checked In'}
                                    </span>
                                </td>
                                <td>{tool.calibration_due}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Active Sessions */}
            <div className="chart-card">
                <h4>Active Sessions</h4>
                {sessionData.length === 0 ? (
                    <p className="no-data">No active sessions currently</p>
                ) : (
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Location</th>
                                <th>Tunnel Section</th>
                                <th>Device</th>
                                <th>Started</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessionData.map((session) => (
                                <tr key={session.id}>
                                    <td>{session.username}</td>
                                    <td>{session.role}</td>
                                    <td>{session.location}</td>
                                    <td>{session.tunnel_section}</td>
                                    <td>{session.device_uid}</td>
                                    <td>{session.started_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ML Predictions */}
            <div className="chart-card">
                <h4>ML Severity Predictions — Active Faults</h4>
                <p className="chart-description">Predicted severity for open and in-progress faults based on fault type, asset class, tunnel section and zone type.</p>
                {mlData.length === 0 ? (
                    <p className="no-data">No active faults to predict</p>
                ) : (
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Fault Type</th>
                                <th>Asset Class</th>
                                <th>Location</th>
                                <th>Tunnel Section</th>
                                <th>Actual Severity</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mlData.map((fault) => (
                                <tr key={fault.id}>
                                    <td>{fault.fault_type}</td>
                                    <td>{fault.asset_class}</td>
                                    <td>{fault.location}</td>
                                    <td>{fault.tunnel_section}</td>
                                    <td>
                                        <span className={`status-badge badge-${fault.actual_severity?.toLowerCase()}`}>
                                            {fault.actual_severity}
                                        </span>
                                    </td>
                                    <td>{fault.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Audit Log */}
            <div className="chart-card">
                <h4>Audit Log</h4>
                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Event</th>
                            <th>Entity</th>
                            <th>Entity ID</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditData.map((log) => (
                            <tr key={log.id}>
                                <td>{log.username}</td>
                                <td>{log.event_type}</td>
                                <td>{log.entity_type}</td>
                                <td>{log.entity_id}</td>
                                <td>{log.occurred_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AnalyticsPanel;
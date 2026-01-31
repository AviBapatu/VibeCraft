import { useEffect, useState } from "react";
import { getCurrentIncident } from "../api/incidentApi";
import { Link } from "react-router-dom";

export default function IncidentsPage() {
    const [incident, setIncident] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCurrentIncident().then((data) => {
            setIncident(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="page-container">
                <h1>Incident Monitor</h1>
                <p>Loading...</p>
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="page-container">
                <h1>Incident Monitor</h1>
                <div className="healthy-state">
                    <p>✓ No active incidents. System healthy.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1>Incident Monitor</h1>

            <table className="incidents-table">
                <thead>
                    <tr>
                        <th>Incident ID</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Approval</th>
                        <th>Started At</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{incident.incident_id}</td>
                        <td>
                            <span className={`badge status-${incident.status?.toLowerCase()}`}>
                                {incident.status}
                            </span>
                        </td>
                        <td>
                            <span className={`badge severity-${incident.severity?.toLowerCase()}`}>
                                {incident.severity}
                            </span>
                        </td>
                        <td>
                            <span className={`badge approval-${incident.approval?.status?.toLowerCase()}`}>
                                {incident.approval?.status}
                            </span>
                        </td>
                        <td>
                            {incident.opened_at
                                ? new Date(incident.opened_at).toLocaleString()
                                : "—"}
                        </td>
                        <td>
                            <Link to={`/incident/${incident.incident_id}`} className="view-link">
                                View
                            </Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

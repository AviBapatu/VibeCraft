import { useEffect, useState } from "react";
import { getCurrentIncident } from "../api/incidentApi";
import { getAttackStatus, getPipelineStatus } from "../api/monitoringApi";
import { Link } from "react-router-dom";
import StatusBanner from "../components/StatusBanner";
import LoadingSpinner from "../components/LoadingSpinner";
import "./IncidentsPage.css";

export default function IncidentsPage() {
    const [incident, setIncident] = useState(null);
    const [attackStatus, setAttackStatus] = useState(null);
    const [pipelineStatus, setPipelineStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [incData, attData, pipeData] = await Promise.all([
                    getCurrentIncident(),
                    getAttackStatus(),
                    getPipelineStatus()
                ]);
                setIncident(incData);
                setAttackStatus(attData);
                setPipelineStatus(pipeData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="page-container">
                <LoadingSpinner text="Loading dashboard..." />
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Incident Monitor</h1>
                <p className="page-subtitle">Real-time system monitoring and incident management</p>
            </div>

            <StatusBanner
                attackStatus={attackStatus}
                pipelineStatus={pipelineStatus}
                incident={incident}
            />

            {!incident ? (
                <div className="healthy-state-card">
                    <div className="healthy-icon">✓</div>
                    <h2>System Healthy</h2>
                    <p>No active incidents detected. All systems operating normally.</p>
                </div>
            ) : (
                <div className="incident-card-grid">
                    <div className="incident-card featured">
                        <div className="card-category">INCIDENT DETECTED</div>
                        <div className="card-header">
                            <h2 className="card-title">Active Incident</h2>
                            <div className="card-badge new">New</div>
                        </div>
                        <div className="card-content">
                            <div className="card-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Incident ID</span>
                                    <span className="info-value">{incident.incident_id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status</span>
                                    <span className={`badge status-${incident.status?.toLowerCase()}`}>
                                        {incident.status}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Severity</span>
                                    <span className={`badge severity-${incident.severity?.toLowerCase()}`}>
                                        {incident.severity}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Approval</span>
                                    <span className={`badge approval-${incident.approval?.status?.toLowerCase()}`}>
                                        {incident.approval?.status}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Started At</span>
                                    <span className="info-value">
                                        {incident.opened_at
                                            ? new Date(incident.opened_at).toLocaleString()
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Link to={`/incident/${incident.incident_id}`} className="card-action">
                            <span>View Details</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 3L14 10L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

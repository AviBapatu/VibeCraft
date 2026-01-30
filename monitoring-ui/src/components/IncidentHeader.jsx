export default function IncidentHeader({ incident }) {
    if (!incident) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case "OPEN": return "status-open";
            case "ONGOING": return "status-ongoing";
            case "RESOLVED": return "status-resolved";
            default: return "";
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case "HIGH": return "severity-high";
            case "MEDIUM": return "severity-medium";
            case "LOW": return "severity-low";
            default: return "";
        }
    };

    const getApprovalColor = (status) => {
        switch (status) {
            case "PENDING": return "approval-pending";
            case "APPROVED": return "approval-approved";
            case "REJECTED": return "approval-rejected";
            default: return "";
        }
    };

    return (
        <div className="incident-header">
            <h1>{incident.incident_id}</h1>
            <div className="badge-group">
                <span className={`badge ${getStatusColor(incident.status)}`}>
                    {incident.status}
                </span>
                <span className={`badge ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                </span>
                <span className={`badge ${getApprovalColor(incident.approval.status)}`}>
                    Approval: {incident.approval.status}
                </span>
            </div>
        </div>
    );
}

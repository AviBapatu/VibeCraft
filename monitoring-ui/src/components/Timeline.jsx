export default function Timeline({ incident }) {
    if (!incident) return null;

    // Build timeline events from incident data
    const events = [];

    if (incident.opened_at) {
        events.push({
            label: "Incident OPENED",
            timestamp: new Date(incident.opened_at).toLocaleTimeString()
        });
    }

    if (incident.signals && incident.signals.length > 0) {
        events.push({
            label: "Signals escalated",
            timestamp: new Date(incident.opened_at).toLocaleTimeString()
        });
    }

    // Check if similar incidents were found
    events.push({
        label: "Similar incident search completed",
        timestamp: new Date().toLocaleTimeString()
    });

    events.push({
        label: "AI reasoning generated",
        timestamp: new Date().toLocaleTimeString()
    });

    if (incident.approval.status === "PENDING") {
        events.push({
            label: "Awaiting approval",
            timestamp: new Date().toLocaleTimeString()
        });
    } else if (incident.approval.decided_at) {
        events.push({
            label: `Decision: ${incident.approval.status}`,
            timestamp: new Date(incident.approval.decided_at).toLocaleTimeString()
        });
    }

    return (
        <div className="timeline-section">
            <h2>Timeline</h2>
            <div className="timeline">
                {events.map((event, idx) => (
                    <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                            <span className="timeline-label">{event.label}</span>
                            <span className="timeline-timestamp">{event.timestamp}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

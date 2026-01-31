import { useMemo } from "react";
import "./TimelineGraph.css";

export default function TimelineGraph({ incident }) {
    if (!incident) return null;

    const timelineEvents = useMemo(() => {
        const events = [];
        const openedAt = incident.started_at ? new Date(incident.started_at) : new Date();

        // Event 1: Incident Opened
        events.push({
            id: 1,
            label: "Incident Opened",
            description: "Initial incident detection",
            timestamp: openedAt,
            status: "completed",
            icon: "🚨",
            color: "#ef4444"
        });

        // Event 2: Signals Detected (Escalation)
        if (incident.signals && incident.signals.length > 0) {
            // If we don't have a specific signal timestamp, use openedAt (since they triggered it)
            // or maybe just slightly after. But better to be accurate to openedAt.
            events.push({
                id: 2,
                label: "Signals Escalated",
                description: `${incident.signals.length} signal(s) detected`,
                timestamp: openedAt,
                status: "completed",
                icon: "📊",
                color: "#f59e0b"
            });
        }

        // Event 3: Similar Incidents Search
        // This usually happens at creation time.
        if (incident.similar_incidents) {
            events.push({
                id: 3,
                label: "Similar Incidents Search",
                description: "Vector memory search completed",
                timestamp: openedAt,
                status: "completed",
                icon: "🔍",
                color: "#6366f1"
            });
        }

        // Event 4: AI Reasoning Generated
        // Event 4: AI Reasoning Generated
        const isReasoningWaiting = incident.reasoning?.uncertainty_notes === "WAITING_FOR_STABLE_SIGNALS";

        if (incident.reasoning && incident.reasoning.created_at && !isReasoningWaiting) {
            events.push({
                id: 4,
                label: "AI Reasoning Generated",
                description: "Hypothesis and recommendations created",
                timestamp: new Date(incident.reasoning.created_at),
                status: "completed",
                icon: "🤖",
                color: "#8b5cf6"
            });
        } else if (incident.status !== "RESOLVED") {
            // Show as pending/loading
            events.push({
                id: 4,
                label: "AI Reasoning",
                description: isReasoningWaiting ? "Waiting for stable signals..." : "Analyzing incident...",
                timestamp: new Date(), // "Now"
                status: "pending",
                icon: "⏳",
                color: "#8b5cf6"
            });
        }

        // Event 5: Approval Status
        if (incident.approval?.status === "PENDING") {
            // Only show pending approval if reasoning is done
            if (incident.reasoning) {
                events.push({
                    id: 5,
                    label: "Awaiting Approval",
                    description: "Pending human decision",
                    timestamp: new Date(),
                    status: "pending",
                    icon: "⏳",
                    color: "#f59e0b"
                });
            }
        } else if (incident.approval?.decided_at) {
            const decidedTime = new Date(incident.approval.decided_at);
            events.push({
                id: 5,
                label: `Decision: ${incident.approval.status}`,
                description: incident.approval.comment || "Decision finalized",
                timestamp: decidedTime,
                status: incident.approval.status === "APPROVED" ? "completed" : "rejected",
                icon: incident.approval.status === "APPROVED" ? "✅" : "❌",
                color: incident.approval.status === "APPROVED" ? "#10b981" : "#ef4444"
            });
        }

        return events;
    }, [incident]);

    const formatTime = (date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getDuration = (start, end) => {
        const diff = Math.abs(end - start) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h`;
    };

    return (
        <div className="timeline-graph-section">
            <div className="timeline-graph-header">
                <h2>Incident Timeline</h2>
                <div className="timeline-stats">
                    <div className="stat-item">
                        <span className="stat-label">Duration</span>
                        <span className="stat-value">
                            {timelineEvents.length > 0
                                ? getDuration(
                                    timelineEvents[0].timestamp,
                                    timelineEvents[timelineEvents.length - 1].timestamp
                                )
                                : "—"}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Events</span>
                        <span className="stat-value">{timelineEvents.length}</span>
                    </div>
                </div>
            </div>

            <div className="timeline-vertical">
                {timelineEvents.map((event, index) => {
                    const isLast = index === timelineEvents.length - 1;
                    const isPending = event.status === "pending";

                    return (
                        <div key={event.id} className={`timeline-item-modern ${event.status} ${isPending ? "pulsing" : ""}`}>
                            <div className="timeline-item-content">
                                <div className="timeline-marker" style={{ borderColor: event.color }}>
                                    <div className="marker-icon" style={{ backgroundColor: `${event.color}20`, color: event.color }}>
                                        <span>{event.icon}</span>
                                    </div>
                                    {!isLast && (
                                        <div className="timeline-connector" style={{ backgroundColor: event.status === "completed" ? event.color : "rgba(255, 255, 255, 0.1)" }}></div>
                                    )}
                                </div>
                                <div className="timeline-card">
                                    <div className="card-header-modern">
                                        <h3 className="card-title-modern">{event.label}</h3>
                                        <div className="card-time">
                                            <span className="time-value">{formatTime(event.timestamp)}</span>
                                            <span className="date-value">{formatDate(event.timestamp)}</span>
                                        </div>
                                    </div>
                                    <p className="card-description-modern">{event.description}</p>
                                    <div className="card-footer">
                                        <span className="status-badge-modern" style={{ backgroundColor: `${event.color}20`, color: event.color, borderColor: event.color }}>
                                            {event.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="timeline-legend">
                <div className="legend-item">
                    <div className="legend-dot completed"></div>
                    <span>Completed</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot pending"></div>
                    <span>Pending</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot rejected"></div>
                    <span>Rejected</span>
                </div>
            </div>
        </div>
    );
}

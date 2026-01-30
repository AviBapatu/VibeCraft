import { useState } from "react";
import { approveIncident } from "../api/incidentApi";

export default function ApprovalPanel({ incident, onDecision }) {
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    if (!incident) return null;

    const approval = incident.approval;

    // Already decided
    if (approval.status !== "PENDING") {
        return (
            <div className="approval-section">
                <h2>Human Approval</h2>
                <div className="approval-finalized">
                    <div className="decision-badge">
                        <span className={`badge ${approval.status === 'APPROVED' ? 'approval-approved' : 'approval-rejected'}`}>
                            {approval.status}
                        </span>
                    </div>
                    <div className="decision-details">
                        <p><strong>Actor:</strong> {approval.actor}</p>
                        <p><strong>Comment:</strong> {approval.comment || "No comment provided"}</p>
                        <p><strong>Decided At:</strong> {new Date(approval.decided_at).toLocaleString()}</p>
                        {approval.approved_with_confidence !== undefined && (
                            <p><strong>Approved with Confidence:</strong> {(approval.approved_with_confidence * 100).toFixed(1)}%</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Pending - show controls
    async function handleDecision(decision) {
        if (!comment.trim()) {
            setError("Comment is required");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const updated = await approveIncident({
                incident_id: incident.incident_id,
                decision,
                actor: "admin", // In real app, this would come from auth
                comment: comment.trim()
            });

            if (onDecision) {
                onDecision(updated);
            }
        } catch (err) {
            setError(err.message || "Approval failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="approval-section">
            <h2>Human Approval</h2>
            <div className="approval-pending">
                <p className="approval-instruction">
                    This incident requires your approval to proceed with the recommended actions.
                </p>

                <div className="approval-form">
                    <label htmlFor="approval-comment">
                        <strong>Approval Comment <span className="required">*</span></strong>
                    </label>
                    <textarea
                        id="approval-comment"
                        placeholder="Enter your decision rationale (required)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isSubmitting}
                        rows={4}
                    />

                    {error && <div className="error-message">{error}</div>}

                    <div className="approval-buttons">
                        <button
                            className="btn btn-approve"
                            onClick={() => handleDecision("APPROVE")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Processing..." : "✓ Approve"}
                        </button>
                        <button
                            className="btn btn-reject"
                            onClick={() => handleDecision("REJECT")}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Processing..." : "✗ Reject"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

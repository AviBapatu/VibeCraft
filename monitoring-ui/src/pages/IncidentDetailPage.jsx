import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getCurrentIncident,
    getSimilarIncidents,
    reasonIncident
} from "../api/incidentApi";

import IncidentHeader from "../components/IncidentHeader";
import TimelineGraph from "../components/TimelineGraph";
import SignalsServices from "../components/SignalsServices";
import SimilarIncidents from "../components/SimilarIncidents";
import ReasoningPanel from "../components/ReasoningPanel";
import ApprovalPanel from "../components/ApprovalPanel";
import LoadingSpinner from "../components/LoadingSpinner";

export default function IncidentDetailPage() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [reasoning, setReasoning] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reasoningLoading, setReasoningLoading] = useState(false);

    const fetchReasoning = async () => {
        setReasoningLoading(true);
        try {
            const reasoningData = await reasonIncident();
            setReasoning(reasoningData);
        } catch (error) {
            console.error("Failed to fetch reasoning:", error);
        } finally {
            setReasoningLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch of everything
        Promise.all([
            getCurrentIncident(),
            getSimilarIncidents(),
            reasonIncident()
        ]).then(([incidentData, similarData, reasoningData]) => {
            setIncident(incidentData);
            setSimilar(similarData?.similar_incidents || []);
            setReasoning(reasoningData);
            setLoading(false);
        }).catch((error) => {
            console.error("Failed to fetch incident data:", error);
            setLoading(false);
        });

        // Poll incident status for updates
        const interval = setInterval(() => {
            getCurrentIncident().then((data) => {
                // Only update if we have an incident to avoid flickering if it disappears momentarily
                if (data) {
                    setIncident(data);
                    if (data.reasoning) {
                        setReasoning(data.reasoning);
                    }
                }
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [id]);

    if (loading) {
        return (
            <div className="page-container">
                <LoadingSpinner text="Loading incident details..." />
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="page-container">
                <div className="empty-state-card">
                    <h2>No Active Incident</h2>
                    <p>No active incident found for this ID.</p>
                    <Link to="/" className="back-link">← Back to incidents</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to incidents</Link>

            <IncidentHeader incident={incident} />
            <TimelineGraph incident={incident} />
            <SignalsServices incident={incident} />
            <SimilarIncidents items={similar} />
            <ReasoningPanel reasoning={reasoning} isLoading={reasoningLoading} onRetry={fetchReasoning} />
            <ApprovalPanel
                incident={incident}
                onDecision={setIncident}
            />
        </div>
    );
}

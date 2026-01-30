import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    getCurrentIncident,
    getSimilarIncidents,
    reasonIncident
} from "../api/incidentApi";

import IncidentHeader from "../components/IncidentHeader";
import Timeline from "../components/Timeline";
import SignalsServices from "../components/SignalsServices";
import SimilarIncidents from "../components/SimilarIncidents";
import ReasoningPanel from "../components/ReasoningPanel";
import ApprovalPanel from "../components/ApprovalPanel";

export default function IncidentDetailPage() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [similar, setSimilar] = useState([]);
    const [reasoning, setReasoning] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all data
        Promise.all([
            getCurrentIncident(),
            getSimilarIncidents(),
            reasonIncident()
        ]).then(([incidentData, similarData, reasoningData]) => {
            setIncident(incidentData);
            setSimilar(similarData?.similar_incidents || []);
            setReasoning(reasoningData);
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <div className="page-container">
                <p>Loading incident details...</p>
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="page-container">
                <p>No active incident found.</p>
                <Link to="/" className="back-link">← Back to incidents</Link>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Link to="/" className="back-link">← Back to incidents</Link>

            <IncidentHeader incident={incident} />
            <Timeline incident={incident} />
            <SignalsServices incident={incident} />
            <SimilarIncidents items={similar} />
            <ReasoningPanel reasoning={reasoning} />
            <ApprovalPanel
                incident={incident}
                onDecision={setIncident}
            />
        </div>
    );
}

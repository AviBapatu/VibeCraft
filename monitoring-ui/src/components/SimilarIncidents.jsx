export default function SimilarIncidents({ items }) {
    if (!items || items.length === 0) {
        return (
            <div className="similar-incidents-section">
                <h2>Similar Past Incidents</h2>
                <p className="empty-state">No similar incidents found in vector memory.</p>
            </div>
        );
    }

    return (
        <div className="similar-incidents-section">
            <h2>Similar Past Incidents</h2>
            <div className="similar-incidents-grid">
                {items.map((item, idx) => (
                    <div key={idx} className="similar-incident-card">
                        <div className="card-header">
                            <h3>{item.incident_id}</h3>
                            <span className={`badge severity-${item.severity?.toLowerCase() || 'medium'}`}>
                                {item.severity || 'N/A'}
                            </span>
                        </div>

                        <div className="card-content">
                            <div className="card-row">
                                <strong>Signals:</strong>
                                <span>{item.signals?.join(", ") || "N/A"}</span>
                            </div>

                            <div className="card-row">
                                <strong>Services:</strong>
                                <span>{item.services?.join(", ") || "N/A"}</span>
                            </div>

                            {item.resolution && (
                                <div className="card-row">
                                    <strong>Resolution:</strong>
                                    <span>{item.resolution}</span>
                                </div>
                            )}

                            {item.similarity_score !== undefined && (
                                <div className="card-row">
                                    <strong>Similarity:</strong>
                                    <span>{(item.similarity_score * 100).toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

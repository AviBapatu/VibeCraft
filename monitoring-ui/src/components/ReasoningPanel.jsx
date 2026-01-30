export default function ReasoningPanel({ reasoning }) {
    if (!reasoning) {
        return (
            <div className="reasoning-section">
                <h2>AI Reasoning</h2>
                <div className="error-state">
                    <p>AI reasoning unavailable. Please retry.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reasoning-section">
            <h2>AI Reasoning</h2>

            <div className="reasoning-content">
                <div className="reasoning-block">
                    <h3>Hypothesis</h3>
                    <p>{reasoning.hypothesis || "No hypothesis provided"}</p>
                </div>

                <div className="reasoning-block">
                    <h3>Evidence</h3>
                    <p>{reasoning.evidence || "No evidence provided"}</p>
                </div>

                <div className="reasoning-block">
                    <h3>Recommended Actions</h3>
                    {reasoning.recommended_actions && reasoning.recommended_actions.length > 0 ? (
                        <ul className="action-list">
                            {reasoning.recommended_actions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No actions recommended</p>
                    )}
                </div>

                <div className="reasoning-block">
                    <h3>Confidence</h3>
                    <div className="confidence-display">
                        <div className="confidence-score">
                            {typeof reasoning.confidence === 'number'
                                ? (reasoning.confidence * 100).toFixed(1) + '%'
                                : reasoning.confidence}
                        </div>
                        {reasoning.confidence_breakdown && (
                            <div className="confidence-breakdown">
                                <small>
                                    Signal overlap: {(reasoning.confidence_breakdown.signal_overlap * 100).toFixed(0)}% •
                                    Service overlap: {(reasoning.confidence_breakdown.service_overlap * 100).toFixed(0)}%
                                    {reasoning.confidence_breakdown.llm_adjustment &&
                                        ` • LLM adj: ${reasoning.confidence_breakdown.llm_adjustment > 0 ? '+' : ''}${(reasoning.confidence_breakdown.llm_adjustment * 100).toFixed(1)}%`
                                    }
                                </small>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

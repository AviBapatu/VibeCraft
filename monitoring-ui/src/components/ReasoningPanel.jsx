export default function ReasoningPanel({ reasoning, isLoading, onRetry }) {
    if (isLoading) {
        return (
            <div className="reasoning-section">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Offline Reasoning Engine</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Analyzing incident...</p>
                    </div>
                </div>
                <div className="bg-gray-800/50 p-8 rounded border border-gray-700 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-gray-400">Generating reasoning...</p>
                </div>
            </div>
        );
    }

    if (!reasoning) {
        return (
            <div className="reasoning-section">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Offline Reasoning Engine</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Deterministic • Explainable • Always Available</p>
                    </div>
                </div>
                <div className="bg-gray-800/50 p-6 rounded border border-yellow-700 text-center">
                    <p className="text-yellow-400 mb-3">⚠️ Reasoning not yet generated</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Generate Reasoning
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="reasoning-section">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">Offline Reasoning Engine</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Deterministic • Explainable • Always Available</p>
                </div>
                {/* Spinner or Status can go here */}
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Hypothesis</h3>
                    <p className="text-gray-200 bg-gray-800/50 p-3 rounded border border-gray-700">
                        {reasoning.hypothesis || "No hypothesis generated."}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Evidence</h3>
                    <div className="text-gray-300 bg-gray-800/50 p-3 rounded border border-gray-700 min-h-[60px]">
                        {Array.isArray(reasoning.evidence) ? (
                            <ul className="list-disc list-inside space-y-1">
                                {reasoning.evidence.map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>{reasoning.evidence || "No evidence provided."}</p>
                        )}
                    </div>
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

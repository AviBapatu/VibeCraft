import React from 'react';

// Possible states:
// 1. HEALTHY: No attack running, no incident.
// 2. COLLECTING: Attack running, no incident yet.
// 3. INCIDENT: Incident detected.
// 4. RECOVERY: Incident resolved / Attack stopped (optional, for now we might just go back to Healthy or stay in Incident if not resolved).

const StatusBanner = ({ attackStatus, pipelineStatus, incident }) => {
    let status = 'HEALTHY';
    let message = 'System Healthy';
    let subMessage = 'Monitoring system stability';
    let colorClass = 'bg-green-100 text-green-800 border-green-200'; // Default Green

    // Logic to determine state
    if (incident) {
        status = 'INCIDENT';
        message = 'Incident Detected';
        subMessage = `Severity: ${incident.severity} — Awaiting approval`;
        colorClass = 'bg-red-100 text-red-800 border-red-200';
    } else if (attackStatus && attackStatus.scenario) {
        status = 'COLLECTING';
        message = 'Simulation Active';
        subMessage = `Scenario: ${attackStatus.scenario} — Collecting signals...`;
        colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    // If in collecting state, we can add more pipeline info if available
    if (status === 'COLLECTING' && pipelineStatus) {
        // potentially extra info, but kept simple for now as requested
    }

    return (
        <div className={`w-full p-4 mb-6 rounded-lg border flex flex-col items-center justify-center text-center transition-colors duration-300 ${colorClass}`}>
            <h2 className="text-xl font-bold uppercase tracking-wide">{message}</h2>
            <p className="text-sm opacity-90 mt-1">{subMessage}</p>

            {/* Debug Info (Optional/Hidden for now, or subtle) */}
            {status === 'COLLECTING' && pipelineStatus && (
                <div className="mt-2 text-xs opacity-75 font-mono">
                    Last Detect: {pipelineStatus.last_detection_at ? new Date(pipelineStatus.last_detection_at).toLocaleTimeString() : 'Waiting...'}
                </div>
            )}
        </div>
    );
};

export default StatusBanner;

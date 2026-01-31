import React from 'react';
import './StatusBanner.css';

const StatusBanner = ({ attackStatus, pipelineStatus, incident }) => {
    let status = 'HEALTHY';
    let message = 'System Healthy';
    let subMessage = 'Monitoring system stability';
    let statusClass = 'status-healthy';

    // Logic to determine state
    if (incident) {
        status = 'INCIDENT';
        message = 'Incident Detected';
        subMessage = `Severity: ${incident.severity} — Awaiting approval`;
        statusClass = 'status-incident';
    } else if (attackStatus && attackStatus.scenario) {
        status = 'COLLECTING';
        message = 'Simulation Active';
        subMessage = `Scenario: ${attackStatus.scenario} — Collecting signals...`;
        statusClass = 'status-collecting';
    }

    return (
        <div className={`status-banner ${statusClass}`}>
            <div className="status-indicator"></div>
            <div className="status-content">
                <h2 className="status-title">{message}</h2>
                <p className="status-subtitle">{subMessage}</p>
            </div>
        </div>
    );
};

export default StatusBanner;

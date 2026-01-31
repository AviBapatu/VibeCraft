import React from 'react';
import './SimulatorStatus.css';

const SimulatorStatus = ({ isRunning, scenarioName }) => {
    return (
        <div className={`simulator-status ${isRunning ? 'status-running' : 'status-normal'}`}>
            <div className="status-indicator"></div>
            <div className="status-content">
                <h2 className="status-title">
                    {isRunning ? 'ATTACK IN PROGRESS' : 'SYSTEM NORMAL'}
                </h2>
                <p className="status-subtitle">
                    {isRunning
                        ? `Injecting faults for scenario: ${scenarioName}`
                        : 'No active scenarios. Waiting for operator input.'}
                </p>
            </div>
        </div>
    );
};

export default SimulatorStatus;

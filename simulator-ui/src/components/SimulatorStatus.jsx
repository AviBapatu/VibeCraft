import React from 'react';

const SimulatorStatus = ({ isRunning, scenarioName }) => {
    return (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <div
                style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: isRunning ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: `1px solid ${isRunning ? 'var(--danger)' : 'var(--success)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}
            >
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: isRunning ? 'var(--danger)' : 'var(--success)',
                        boxShadow: isRunning ? '0 0 10px var(--danger)' : 'none',
                        animation: isRunning ? 'pulse 2s infinite' : 'none'
                    }}
                />
                <div>
                    <h4 style={{ margin: 0, color: isRunning ? 'var(--danger)' : 'var(--success)' }}>
                        {isRunning ? 'ATTACK IN PROGRESS' : 'SYSTEM NORMAL'}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {isRunning
                            ? `Injecting faults for scenario: ${scenarioName}`
                            : 'No active scenarios. Waiting for operator input.'}
                    </p>
                </div>
            </div>
            <style>
                {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
            </style>
        </div>
    );
};

export default SimulatorStatus;

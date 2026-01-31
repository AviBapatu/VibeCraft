import React, { useState, useEffect } from 'react';

const ScenarioControls = ({ isRunning, onStart, onStop, disabled }) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={onStart}
                    disabled={disabled || isRunning}
                    style={{ opacity: (disabled || isRunning) ? 0.5 : 1, cursor: (disabled || isRunning) ? 'not-allowed' : 'pointer' }}
                >
                    Start Simulation
                </button>
                <button
                    className="btn btn-danger"
                    onClick={onStop}
                    disabled={!isRunning}
                    style={{ opacity: !isRunning ? 0.5 : 1, cursor: !isRunning ? 'not-allowed' : 'pointer' }}
                >
                    Stop Simulation
                </button>
            </div>

            {isRunning && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>DURATION</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                        {formatTime(duration)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ScenarioControls;

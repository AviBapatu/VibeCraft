import React, { useState, useEffect } from 'react';
import './ScenarioControls.css';

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
        <div className="scenario-controls">
            <div className="controls-buttons">
                <button
                    className="btn btn-primary"
                    onClick={onStart}
                    disabled={disabled || isRunning}
                >
                    Start Simulation
                </button>
                <button
                    className="btn btn-danger"
                    onClick={onStop}
                    disabled={!isRunning}
                >
                    Stop Simulation
                </button>
            </div>

            {isRunning && (
                <div className="duration-display">
                    <span className="duration-label">DURATION</span>
                    <span className="duration-value">
                        {formatTime(duration)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ScenarioControls;

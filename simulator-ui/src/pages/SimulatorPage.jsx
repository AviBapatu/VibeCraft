import React, { useState, useEffect } from 'react';
import ScenarioCard from '../components/ScenarioCard';
import ScenarioControls from '../components/ScenarioControls';
import SimulatorStatus from '../components/SimulatorStatus';
import { simulatorApi } from '../api/simulatorApi';
import './SimulatorPage.css';

const SCENARIOS = [
    {
        id: 'auth-failure',
        title: 'Auth Failure Storm',
        description: 'Simulates a credential stuffing attack resulting in a high rate of 401/403 errors.',
        signals: ['High 401 Rate', 'Login Latency Spike', 'New IP Surge']
    },
    {
        id: 'latency-degradation',
        title: 'Latency Degradation',
        description: 'Injects artificial latency into service responses to simulate performance degradation.',
        signals: ['P99 Latency > 2s', 'Timeout Errors', 'Slow SQL Queries']
    },
    {
        id: 'db-exhaustion',
        title: 'Database Exhaustion',
        description: 'Simulates connection pool saturation and slow queries on the database.',
        signals: ['DB Connection Pool Full', 'Transaction Timeouts', 'High CPU Usage']
    },
    {
        id: 'traffic-anomaly',
        title: 'Traffic Anomaly',
        description: 'Generates a sudden spike in request volume, simulating a DDoS or viral event.',
        signals: ['Request Rate +500%', 'Gateway 502s', 'Autoscaling Lag']
    },
    {
        id: 'cascading-failure',
        title: 'Cascading Failure',
        description: 'Simulates a failure in a dependency that propagates to upstream services.',
        signals: ['Dependency 500s', 'Retry Storm', 'Circuit Breaker Open']
    },
];

const SimulatorPage = () => {
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState(null);
    const [startedAt, setStartedAt] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Sync with backend state on load
    useEffect(() => {
        const syncState = async () => {
            try {
                const status = await simulatorApi.getAttackStatus();
                if (status && status.scenario) {
                    const scenario = SCENARIOS.find(s => s.id === status.scenario);
                    if (scenario) {
                        setSelectedScenario(scenario);
                        setIsRunning(true);
                        if (status.started_at) {
                            setStartedAt(status.started_at);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to sync attack status:', err);
            }
        };

        syncState();
    }, []);

    // Timer logic
    useEffect(() => {
        let interval;
        if (isRunning && startedAt) {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
            interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }

        return () => clearInterval(interval);
    }, [isRunning, startedAt]);

    const handleSelect = (scenario) => {
        if (!isRunning) {
            setSelectedScenario(scenario);
            setError(null);
        }
    };

    const handleStart = async () => {
        if (!selectedScenario) return;

        try {
            setError(null);
            await simulatorApi.startScenario(selectedScenario.id);
            setIsRunning(true);
            setStartedAt(Date.now());
        } catch (err) {
            console.error('Failed to start scenario:', err);
            if (err.response && err.response.status === 409) {
                setError('Another scenario is already running. Please stop it first.');
            } else {
                setError('Failed to start simulation. Check backend connection.');
            }
            setIsRunning(false);
            setStartedAt(null);
        }
    };

    const handleStop = async () => {
        if (!selectedScenario) return;

        try {
            await simulatorApi.stopScenario(selectedScenario.id);
        } catch (err) {
            console.error('Failed to stop scenario:', err);
            setError('Failed to stop simulation. Force reset recommended.');
        } finally {
            setIsRunning(false);
            setStartedAt(null);
        }
    };

    const handleReset = async () => {
        if (confirm("Are you sure you want to reset the incident state? This is for DEMO purposes only.")) {
            try {
                await simulatorApi.resetDemoState();
                alert("Demo state cleared. System ready for next test.");
            } catch (err) {
                console.error("Reset failed:", err);
                alert("Failed to reset demo state. Check backend logs.");
            }
        }
    };

    return (
        <div className="container">
            <header className="simulator-header">
                <div className="header-content">
                    <div>
                        <h1 className="page-title">VibeCraft Attack Simulator</h1>
                        <p className="page-subtitle">Fault Injection Control Panel</p>
                    </div>
                    <button
                        className="btn btn-reset"
                        onClick={handleReset}
                        disabled={isRunning}
                        title={isRunning ? "Stop the scenario before resetting demo state" : ""}
                    >
                        Reset Incident State (Demo Only)
                    </button>
                </div>
            </header>

            <SimulatorStatus isRunning={isRunning} scenarioName={selectedScenario?.title} />

            {isRunning && (
                <div className="timer-display">
                    Running for: <span className="timer-value">{elapsedSeconds}s</span>
                </div>
            )}

            {error && (
                <div className="error-banner">
                    <strong>Error: </strong> {error}
                </div>
            )}

            <div className="scenarios-grid">
                {SCENARIOS.map(scenario => (
                    <ScenarioCard
                        key={scenario.id}
                        scenario={scenario}
                        isSelected={selectedScenario?.id === scenario.id}
                        onSelect={handleSelect}
                        disabled={isRunning && selectedScenario?.id !== scenario.id}
                    />
                ))}
            </div>

            <div className="controls-container">
                {selectedScenario ? (
                    <ScenarioControls
                        isRunning={isRunning}
                        onStart={handleStart}
                        onStop={handleStop}
                        disabled={!selectedScenario}
                    />
                ) : (
                    <div className="card empty-selection">
                        <p>Select a scenario above to configure the simulation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimulatorPage;

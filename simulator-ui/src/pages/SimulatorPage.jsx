import React, { useState, useEffect } from 'react';
import ScenarioCard from '../components/ScenarioCard';
import ScenarioControls from '../components/ScenarioControls';
import SimulatorStatus from '../components/SimulatorStatus';
import { simulatorApi } from '../api/simulatorApi';

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
                // Don't show error to user immediately on load, just log it
            }
        };

        syncState();
    }, []);

    // Timer logic
    useEffect(() => {
        let interval;
        if (isRunning && startedAt) {
            // Immediate update
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
            setStartedAt(Date.now()); // Optimistic update, backend is source of truth
        } catch (err) {
            console.error('Failed to start scenario:', err);
            // Even if it fails, we keep isRunning as false
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
            // We always reset UI state to stopped on stop click, per "stateless" philosophy
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
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>VibeCraft Attack Simulator</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>
                        Fault Injection Control Panel
                    </p>
                    <button
                        className="btn"
                        onClick={handleReset}
                        disabled={isRunning}
                        title={isRunning ? "Stop the scenario before resetting demo state" : ""}
                        style={{
                            backgroundColor: isRunning ? 'var(--text-secondary)' : '#ef4444',
                            color: 'white',
                            border: '1px solid #ef4444',
                            opacity: isRunning ? 0.5 : 1,
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            padding: '0.5rem 1rem'
                        }}
                    >
                        Reset Incident State (Demo Only)
                    </button>
                </div>
            </header>


            <SimulatorStatus isRunning={isRunning} scenarioName={selectedScenario?.title} />

            {isRunning && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'var(--primary)'
                }}>
                    Running for: {elapsedSeconds}s
                </div>
            )}

            {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--text-primary)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--danger)' }}>
                    <strong>Error: </strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
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

            <div style={{ position: 'sticky', bottom: '2rem', marginTop: '2rem' }}>
                {selectedScenario ? (
                    <ScenarioControls
                        isRunning={isRunning}
                        onStart={handleStart}
                        onStop={handleStop}
                        disabled={!selectedScenario}
                    />
                ) : (
                    <div className="card" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Select a scenario above to configure the simulation.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimulatorPage;

import React from 'react';

const ScenarioCard = ({ scenario, isSelected, onSelect, disabled }) => {
    return (
        <div
            className={`card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelect(scenario)}
            style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'rgba(30, 41, 59, 0.5)',
                opacity: disabled ? 0.6 : 1
            }}
        >
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{scenario.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{scenario.description}</p>

            <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Signals:</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {scenario.signals.map((signal, idx) => (
                        <span
                            key={idx}
                            style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--accent-primary)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}
                        >
                            {signal}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScenarioCard;

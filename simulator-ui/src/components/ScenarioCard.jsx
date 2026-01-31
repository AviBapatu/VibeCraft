import React from 'react';
import './ScenarioCard.css';

const ScenarioCard = ({ scenario, isSelected, onSelect, disabled }) => {
    return (
        <div
            className={`scenario-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelect(scenario)}
        >
            <div className="card-category">ATTACK SCENARIO</div>
            <div className="card-header">
                <h3 className="card-title">{scenario.title}</h3>
            </div>
            <p className="card-description">{scenario.description}</p>

            <div className="signals-section">
                <h4 className="signals-label">Signals:</h4>
                <div className="signals-list">
                    {scenario.signals.map((signal, idx) => (
                        <span key={idx} className="signal-badge">
                            {signal}
                        </span>
                    ))}
                </div>
            </div>

            {isSelected && (
                <div className="selected-indicator">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                    </svg>
                    Selected
                </div>
            )}
        </div>
    );
};

export default ScenarioCard;

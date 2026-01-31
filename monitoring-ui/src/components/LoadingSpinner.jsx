import "./LoadingSpinner.css";

export default function LoadingSpinner({ size = "medium", text = "Loading..." }) {
    return (
        <div className="loading-container">
            <div className={`spinner-wrapper spinner-${size}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
}


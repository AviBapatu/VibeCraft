import { useState, useRef, useEffect } from "react";
import "./FaceCapture.css";

export default function FaceCapture({ onCapture, capturedImage }) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState("");
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            // Cleanup: stop camera when component unmounts
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError("");
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(
                err.name === "NotAllowedError"
                    ? "Camera access denied. Please allow camera access to continue."
                    : "Failed to access camera. Please check your camera permissions."
            );
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        
        // Call the callback with the captured image
        if (onCapture) {
            onCapture(imageData);
        }

        // Stop camera after capture
        stopCamera();
    };

    const retakePhoto = () => {
        if (onCapture) {
            onCapture(null);
        }
        startCamera();
    };

    return (
        <div className="face-capture-container">
            <label className="face-capture-label">
                Face Verification <span className="required">*</span>
            </label>
            <p className="face-capture-description">
                Please capture your face for account verification
            </p>

            {error && (
                <div className="face-capture-error">{error}</div>
            )}

            {!capturedImage ? (
                <div className="camera-preview">
                    {!isStreaming ? (
                        <div className="camera-placeholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                            <p>Camera not started</p>
                            <button
                                type="button"
                                className="btn-camera-start"
                                onClick={startCamera}
                            >
                                Start Camera
                            </button>
                        </div>
                    ) : (
                        <div className="camera-active">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="camera-video"
                            />
                            <div className="face-overlay">
                                <div className="face-guide"></div>
                            </div>
                            <div className="camera-controls">
                                <button
                                    type="button"
                                    className="btn-camera-capture"
                                    onClick={capturePhoto}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    Capture
                                </button>
                                <button
                                    type="button"
                                    className="btn-camera-cancel"
                                    onClick={stopCamera}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
            ) : (
                <div className="captured-preview">
                    <img src={capturedImage} alt="Captured face" className="captured-image" />
                    <button
                        type="button"
                        className="btn-retake"
                        onClick={retakePhoto}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6M23 20v-6h-6"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Retake Photo
                    </button>
                </div>
            )}
        </div>
    );
}


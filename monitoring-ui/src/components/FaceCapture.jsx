import { useState, useRef, useEffect } from "react";
import "./FaceCapture.css";

export default function FaceCapture({ onCapture, capturedImage }) {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
            setIsLoading(true);
            setIsStreaming(false);
            
            // Stop any existing stream first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = null;
                // Remove old event listeners
                videoRef.current.onloadedmetadata = null;
                videoRef.current.onerror = null;
                videoRef.current.onplaying = null;
            }
            
            // Check if getUserMedia is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported in this browser");
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            if (!videoRef.current) {
                stream.getTracks().forEach(track => track.stop());
                throw new Error("Video element not available");
            }

            const video = videoRef.current;
            video.srcObject = stream;
            streamRef.current = stream;
            
            // Wait for video metadata to load and then play
            const handleLoadedMetadata = async () => {
                try {
                    setIsLoading(false);
                    await video.play();
                    setIsStreaming(true);
                    console.log("Video started successfully");
                } catch (playErr) {
                    console.error("Error playing video:", playErr);
                    setIsLoading(false);
                    setError("Failed to start video playback. Please try again.");
                    stopCamera();
                }
            };
            
            const handleError = (e) => {
                console.error("Video error:", e);
                setIsLoading(false);
                setError("Video playback error. Please try again.");
                stopCamera();
            };
            
            const handlePlaying = () => {
                setIsStreaming(true);
                setIsLoading(false);
                console.log("Video is playing");
            };
            
            // Set up event listeners
            video.onloadedmetadata = handleLoadedMetadata;
            video.onerror = handleError;
            video.onplaying = handlePlaying;
            
            // If metadata is already loaded, play immediately
            if (video.readyState >= 1) {
                handleLoadedMetadata();
            } else {
                // Force load if metadata doesn't load automatically
                video.load();
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setIsLoading(false);
            setIsStreaming(false);
            setError(
                err.name === "NotAllowedError"
                    ? "Camera access denied. Please allow camera access to continue."
                    : err.name === "NotFoundError"
                    ? "No camera found. Please connect a camera and try again."
                    : err.name === "NotReadableError"
                    ? "Camera is already in use by another application."
                    : err.message || "Failed to access camera. Please check your camera permissions."
            );
            // Clean up on error
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.onloadedmetadata = null;
            videoRef.current.onerror = null;
            videoRef.current.onplaying = null;
        }
        setIsStreaming(false);
        setIsLoading(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) {
            setError("Camera components not ready. Please try again.");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Check if video is ready and has valid dimensions
        if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
            setError("Video is not ready. Please wait a moment and try again.");
            return;
        }

        try {
            const context = canvas.getContext("2d");

            // Compress image to reduce payload size (max 640x480)
            const maxWidth = 640;
            const maxHeight = 480;
            let finalWidth = video.videoWidth;
            let finalHeight = video.videoHeight;
            
            // Scale down if too large
            if (finalWidth > maxWidth || finalHeight > maxHeight) {
                const ratio = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
                finalWidth = Math.floor(finalWidth * ratio);
                finalHeight = Math.floor(finalHeight * ratio);
            }
            
            // Set canvas to final size
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            
            // Draw scaled image to canvas
            context.drawImage(video, 0, 0, finalWidth, finalHeight);
            
            // Convert to base64 with compression (0.7 quality for smaller file size)
            // This stores the image locally in memory - no API call is made here
            const imageData = canvas.toDataURL("image/jpeg", 0.7);
            
            // Validate that we got image data
            if (!imageData || imageData === "data:,") {
                setError("Failed to capture image. Please try again.");
                return;
            }
            
            // Store the captured image in parent component state
            // The image is stored locally and will be sent to backend only when user clicks SIGN UP
            if (onCapture) {
                onCapture(imageData);
            }

            // Stop camera after capture
            stopCamera();
        } catch (err) {
            console.error("Error capturing photo:", err);
            setError("Failed to capture photo. Please try again.");
        }
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
                    {!isStreaming && !isLoading ? (
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
                            {isLoading && (
                                <div className="camera-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Starting camera...</p>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="camera-video"
                                style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: isStreaming ? 'block' : 'none'
                                }}
                            />
                            {isStreaming && (
                                <>
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
                                </>
                            )}
                        </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
            ) : (
                <div className="captured-preview">
                    {capturedImage && (
                        <>
                            <img 
                                src={capturedImage} 
                                alt="Captured face" 
                                className="captured-image"
                                onError={(e) => {
                                    console.error("Error loading captured image:", e);
                                    setError("Failed to display captured image. Please try again.");
                                }}
                            />
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
}


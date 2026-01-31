import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, signup } from "../api/authApi";
import FaceCapture from "../components/FaceCapture";
import "./AuthPage.css";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [faceImage, setFaceImage] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { auth, setAuth } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [auth.isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                const response = await login(email, password);
                if (response.success) {
                    setAuth({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token
                    });
                    navigate("/");
                } else {
                    setError(response.message || "Login failed");
                }
            } else {
                // Validate minimum password length first (increased to 8)
                const MIN_PASSWORD_LENGTH = 8;
                const MAX_PASSWORD_CHARS = 100;
                
                if (password.length < MIN_PASSWORD_LENGTH) {
                    setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
                    setLoading(false);
                    return;
                }
                
                // Check maximum character length (allow up to 100 characters)
                // Bcrypt will handle byte truncation automatically if needed
                if (password.length > MAX_PASSWORD_CHARS) {
                    setError(`Password is too long. Maximum ${MAX_PASSWORD_CHARS} characters allowed.`);
                    setLoading(false);
                    return;
                }
                
                // Validate password match
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                
                // Ensure face image is captured before proceeding
                if (!faceImage) {
                    setError("Please capture your face image for verification");
                    setLoading(false);
                    return;
                }
                
                // Only make API call after image is captured
                // The image is already stored in state, now create the account
                const response = await signup(email, password, faceImage);
                if (response.success) {
                    setAuth({
                        isAuthenticated: true,
                        user: response.user,
                        token: response.token
                    });
                    navigate("/");
                } else {
                    setError(response.message || "Signup failed");
                }
            }
        } catch (err) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left Side - Image */}
            <div className="auth-left-panel">
                <img 
                    src="/image.png" 
                    alt="Monitoring Dashboard" 
                    className="auth-image"
                />
            </div>

            {/* Right Side - Form */}
            <div className="auth-right-panel">
                <div className="auth-card">
                    <h2 className="auth-page-title">Incident Monitoring</h2>
                    <h1 className="auth-title">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin
                            ? "Sign in to access the monitoring dashboard"
                            : "Sign up to get started"}
                    </p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        const newPassword = e.target.value;
                                        setPassword(newPassword);
                                        
                                        // Clear previous errors when user starts typing
                                        if (error) {
                                            setError("");
                                        }
                                        
                                        // Only validate maximum character length (100 chars)
                                        // Bcrypt will handle byte truncation if needed
                                        const MAX_CHARS = 100;
                                        if (newPassword.length > MAX_CHARS) {
                                            setError(`Password is too long. Maximum ${MAX_CHARS} characters allowed.`);
                                        }
                                    }}
                                    placeholder="Enter your password (min 8 characters, max 100 characters)"
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    minLength={8}
                                    maxLength={100}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                    onChange={(e) => {
                                        const newConfirmPassword = e.target.value;
                                        setConfirmPassword(newConfirmPassword);
                                        
                                        // Clear previous errors when user starts typing
                                        if (error) {
                                            setError("");
                                        }
                                        
                                        // Validate maximum character length (100 chars)
                                        // Bcrypt will handle byte truncation if needed
                                        const MAX_CHARS = 100;
                                        if (newConfirmPassword.length > MAX_CHARS) {
                                            setError(`Password is too long. Maximum ${MAX_CHARS} characters allowed.`);
                                        }
                                    }}
                                    placeholder="Confirm your password (min 8 characters, max 100 characters)"
                                            required
                                            autoComplete="new-password"
                                    minLength={8}
                                    maxLength={100}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <FaceCapture
                                    onCapture={setFaceImage}
                                    capturedImage={faceImage}
                                />
                            </>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || (!isLogin && !faceImage)}
                        >
                            {loading ? (
                                <span className="btn-loading">
                                    <span className="spinner"></span>
                                    Processing...
                                </span>
                            ) : (
                                isLogin ? "SIGN IN" : "SIGN UP"
                            )}
                        </button>
                    </form>

                    <div className="auth-switch">
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError("");
                                    setPassword("");
                                    setConfirmPassword("");
                                    setFaceImage(null);
                                    setShowPassword(false);
                                    setShowConfirmPassword(false);
                                }}
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


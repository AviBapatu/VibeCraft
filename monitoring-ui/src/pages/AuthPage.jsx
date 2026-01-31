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
                if (password !== confirmPassword) {
                    setError("Passwords do not match");
                    setLoading(false);
                    return;
                }
                if (!faceImage) {
                    setError("Please capture your face image for verification");
                    setLoading(false);
                    return;
                }
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
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                minLength={6}
                            />
                        </div>

                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                        autoComplete="new-password"
                                        minLength={6}
                                    />
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
                            disabled={loading}
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


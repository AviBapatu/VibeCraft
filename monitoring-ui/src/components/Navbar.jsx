import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar() {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <h2 className="navbar-title">Incident Monitor</h2>
                <div className="navbar-right">
                    {auth.user && (
                        <span className="navbar-user">{auth.user.email}</span>
                    )}
                    <ThemeToggle />
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}


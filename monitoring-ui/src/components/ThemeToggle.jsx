import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
    const { currentTheme, toggleTheme } = useTheme();
    const isDark = currentTheme === "dark";

    return (
        <button 
            className="theme-toggle-dark"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
            title={`Current: ${isDark ? "Dark" : "Light"} mode. Click to switch to ${isDark ? "Light" : "Dark"} mode`}
        >
            <div className="theme-toggle-icon">
                {isDark ? (
                    <span className="moon-icon">🌙</span>
                ) : (
                    <span className="sun-icon">☀️</span>
                )}
            </div>
        </button>
    );
}


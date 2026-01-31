import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const THEMES = {
    light: {
        name: "Light",
        icon: "☀️",
        description: "Light theme",
        colors: {
            "--bg-primary": "#ffffff",
            "--bg-secondary": "#ffffff",
            "--bg-tertiary": "#f8f9fa",
            "--text-primary": "#1a1a1a",
            "--text-secondary": "#6b7280",
            "--accent-blue": "#8b7cf6",
            "--accent-purple": "#a78bfa",
            "--accent-pink": "#fce7f3",
            "--accent-green": "#d1fae5",
            "--accent-red": "#fee2e2",
            "--accent-yellow": "#fef3c7",
            "--gradient-primary": "linear-gradient(135deg, #a78bfa 0%, #8b7cf6 50%, #c4b5fd 100%)",
            "--gradient-secondary": "linear-gradient(135deg, #8b7cf6 0%, #a78bfa 100%)",
            "--border-color": "rgba(0, 0, 0, 0.06)",
            "--glow-purple": "rgba(167, 139, 250, 0.08)",
            "--glow-blue": "rgba(139, 124, 246, 0.08)",
            "--shadow-soft": "0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)",
            "--shadow-medium": "0 4px 20px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)",
        },
        bodyBackground: "linear-gradient(135deg, rgba(230, 220, 255, 0.3) 0%, rgba(255, 240, 250, 0.2) 50%, rgba(255, 255, 255, 1) 100%)"
    },
    dark: {
        name: "Dark",
        icon: "🌙",
        description: "Dark theme",
        colors: {
            "--bg-primary": "#0a0a0f",
            "--bg-secondary": "#0f0f1a",
            "--bg-tertiary": "#1a1a2e",
            "--text-primary": "#ffffff",
            "--text-secondary": "#a0a0b8",
            "--accent-blue": "#6366f1",
            "--accent-purple": "#8b5cf6",
            "--accent-pink": "#ec4899",
            "--accent-green": "#10b981",
            "--accent-red": "#ef4444",
            "--accent-yellow": "#f59e0b",
            "--gradient-primary": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
            "--gradient-secondary": "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            "--border-color": "rgba(255, 255, 255, 0.1)",
            "--glow-purple": "rgba(139, 92, 246, 0.3)",
            "--glow-blue": "rgba(99, 102, 241, 0.3)",
        },
        bodyBackground: "radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0f 50%, #000000 100%)"
    }
};

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState("dark");

    useEffect(() => {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme && THEMES[savedTheme]) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        // Listen for storage events to sync theme across tabs/apps (same origin)
        const handleStorageChange = (e) => {
            if (e.key === "theme" && e.newValue && THEMES[e.newValue]) {
                setCurrentTheme(e.newValue);
            }
        };
        
        window.addEventListener("storage", handleStorageChange);
        
        // Listen for custom events (for same-origin sync within same port)
        const handleCustomStorageChange = (e) => {
            if (e.detail && e.detail.key === "theme" && THEMES[e.detail.newValue]) {
                setCurrentTheme(e.detail.newValue);
            }
        };
        
        window.addEventListener("themeChange", handleCustomStorageChange);
        
        // Use BroadcastChannel for cross-port communication (5173 <-> 5174)
        let channel;
        try {
            channel = new BroadcastChannel("theme-sync");
            channel.onmessage = (event) => {
                if (event.data && event.data.type === "themeChange" && THEMES[event.data.theme]) {
                    setCurrentTheme(event.data.theme);
                }
            };
        } catch (e) {
            console.warn("BroadcastChannel not supported:", e);
        }
        
        // Poll localStorage periodically to sync across different ports
        // Since different ports are different origins, we need polling
        const pollInterval = setInterval(() => {
            const savedTheme = localStorage.getItem("theme");
            if (savedTheme && THEMES[savedTheme] && savedTheme !== currentTheme) {
                setCurrentTheme(savedTheme);
            }
        }, 500); // Check every 500ms
        
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("themeChange", handleCustomStorageChange);
            if (channel) channel.close();
            clearInterval(pollInterval);
        };
    }, []);

    useEffect(() => {
        // Apply theme to document root with smooth transition
        const theme = THEMES[currentTheme];
        if (theme) {
            const root = document.documentElement;
            const body = document.body;
            
            // Add transition class for smooth theme change
            root.classList.add("theme-transitioning");
            
            Object.entries(theme.colors).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });
            
            // Update body background
            if (theme.bodyBackground) {
                body.style.background = theme.bodyBackground;
            } else {
                body.style.background = "none";
            }
            
            localStorage.setItem("theme", currentTheme);
            
            // Dispatch custom event for same-origin sync (same port, different tabs)
            window.dispatchEvent(new CustomEvent("themeChange", {
                detail: { key: "theme", newValue: currentTheme }
            }));
            
            // Broadcast to other tabs using BroadcastChannel (same origin)
            try {
                const channel = new BroadcastChannel("theme-sync");
                channel.postMessage({ type: "themeChange", theme: currentTheme });
                channel.close();
            } catch (e) {
                console.warn("BroadcastChannel not supported:", e);
            }
            
            // Update shared cookie for cross-port sync (5173 <-> 5174)
            // Cookies work across different localhost ports
            document.cookie = `app-theme=${currentTheme}; path=/; max-age=31536000; SameSite=Lax`;
            
            // Remove transition class after animation
            setTimeout(() => {
                root.classList.remove("theme-transitioning");
            }, 300);
        }
    }, [currentTheme]);

    const toggleTheme = () => {
        const newTheme = currentTheme === "light" ? "dark" : "light";
        setCurrentTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, toggleTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}


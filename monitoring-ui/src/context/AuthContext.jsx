import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        user: null,
        token: null
    });

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedAuth = localStorage.getItem("auth");
        if (storedAuth) {
            try {
                const parsedAuth = JSON.parse(storedAuth);
                setAuth(parsedAuth);
            } catch (error) {
                console.error("Failed to parse stored auth:", error);
                localStorage.removeItem("auth");
            }
        }
    }, []);

    // Save auth state to localStorage whenever it changes
    useEffect(() => {
        if (auth.isAuthenticated && auth.token) {
            localStorage.setItem("auth", JSON.stringify(auth));
        } else {
            localStorage.removeItem("auth");
        }
    }, [auth]);

    const logout = () => {
        setAuth({
            isAuthenticated: false,
            user: null,
            token: null
        });
        localStorage.removeItem("auth");
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}


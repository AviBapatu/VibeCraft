const BASE_URL = import.meta.env.VITE_MONITORING_BACKEND_URL || "http://localhost:5000";

export async function getAttackStatus() {
    try {
        const res = await fetch(`${BASE_URL}/attack/status`);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch attack status:", error);
        return null;
    }
}

export async function getPipelineStatus() {
    try {
        const res = await fetch(`${BASE_URL}/pipeline/status`);
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch pipeline status:", error);
        return null;
    }
}

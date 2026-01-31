const BASE_URL = import.meta.env.VITE_MONITORING_BACKEND_URL || "http://localhost:5000";

export async function getCurrentIncident() {
    try {
        const res = await fetch(`${BASE_URL}/incident/current`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch current incident:", error);
        return null;
    }
}

export async function getSimilarIncidents() {
    try {
        const res = await fetch(`${BASE_URL}/incident/similar`, {
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (!res.ok) {
            return { similar_incidents: [] };
        }
        return res.json();
    } catch (error) {
        console.error("Failed to fetch similar incidents:", error);
        return { similar_incidents: [] };
    }
}

export async function reasonIncident() {
    try {
        const res = await fetch(`${BASE_URL}/incident/reason`, {
            method: "POST",
            headers: { "ngrok-skip-browser-warning": "true" }
        });
        if (!res.ok) {
            return null;
        }
        return res.json();
    } catch (error) {
        console.error("Failed to fetch reasoning:", error);
        return null;
    }
}

export async function approveIncident(payload) {
    const res = await fetch(`${BASE_URL}/incident/approve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Approval failed");
    }
    return res.json();
}

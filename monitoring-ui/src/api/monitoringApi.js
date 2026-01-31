const ATTACK_API_URL = 'http://localhost:4000';
const MONITORING_API_URL = 'http://localhost:8000';

export async function getAttackStatus() {
    try {
        const response = await fetch(`${ATTACK_API_URL}/attack/status`);
        if (!response.ok) {
            throw new Error('Failed to fetch attack status');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching attack status:', error);
        return null;
    }
}

export async function getPipelineStatus() {
    try {
        const response = await fetch(`${MONITORING_API_URL}/debug/pipeline`);
        if (!response.ok) {
            throw new Error('Failed to fetch pipeline status');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching pipeline status:', error);
        return null;
    }
}

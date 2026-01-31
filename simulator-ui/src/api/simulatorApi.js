import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';
const MONITORING_BASE = 'http://localhost:5000';

export const simulatorApi = {
    startScenario: async (name) => {
        const response = await axios.post(`${API_BASE_URL}/attack/start/${name}`);
        return response.data;
    },
    stopScenario: async (name) => {
        const response = await axios.post(`${API_BASE_URL}/attack/stop/${name}`);
        return response.data;
    },
    getAttackStatus: async () => {
        const response = await axios.get(`${API_BASE_URL}/attack/status`);
        return response.data;
    },
    resetDemoState: async () => {
        const response = await axios.post(`${MONITORING_BASE}/demo/reset`);
        return response.data;
    }
};


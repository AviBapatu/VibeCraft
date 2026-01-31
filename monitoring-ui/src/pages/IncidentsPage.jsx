import { useEffect, useState } from "react";
import { getCurrentIncident } from "../api/incidentApi";
import { getAttackStatus, getPipelineStatus } from "../api/monitoringApi";
import { Link } from "react-router-dom";
import StatusBanner from "../components/StatusBanner";

export default function IncidentsPage() {
    const [incident, setIncident] = useState(null);
    const [attackStatus, setAttackStatus] = useState(null);
    const [pipelineStatus, setPipelineStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [incData, attData, pipeData] = await Promise.all([
                    getCurrentIncident(),
                    getAttackStatus(),
                    getPipelineStatus()
                ]);
                setIncident(incData);
                setAttackStatus(attData);
                setPipelineStatus(pipeData);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data", err);
                setLoading(false);
            }
        };

        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 2000); // Poll every 2s

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="page-container p-6">
                <h1 className="text-2xl font-bold mb-4">Incident Monitor</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="page-container p-6">
            <h1 className="text-2xl font-bold mb-6">Incident Monitor</h1>

            <StatusBanner
                attackStatus={attackStatus}
                pipelineStatus={pipelineStatus}
                incident={incident}
            />

            {!incident ? (
                <div className="healthy-state mt-8 text-center p-10 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">✓ No active incidents. System healthy.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="incidents-table w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="p-3 font-semibold text-gray-700">Incident ID</th>
                                <th className="p-3 font-semibold text-gray-700">Status</th>
                                <th className="p-3 font-semibold text-gray-700">Severity</th>
                                <th className="p-3 font-semibold text-gray-700">Approval</th>
                                <th className="p-3 font-semibold text-gray-700">Started At</th>
                                <th className="p-3 font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 text-gray-800">{incident.incident_id}</td>
                                <td className="p-3">
                                    <span className={`badge px-2 py-1 rounded text-xs font-semibold status-${incident.status?.toLowerCase()}`}>
                                        {incident.status}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`badge px-2 py-1 rounded text-xs font-semibold severity-${incident.severity?.toLowerCase()}`}>
                                        {incident.severity}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`badge px-2 py-1 rounded text-xs font-semibold approval-${incident.approval?.status?.toLowerCase()}`}>
                                        {incident.approval?.status}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-600">
                                    {incident.opened_at
                                        ? new Date(incident.opened_at).toLocaleString()
                                        : "—"}
                                </td>
                                <td className="p-3">
                                    <Link to={`/incident/${incident.incident_id}`} className="view-link text-blue-600 hover:text-blue-800 font-medium">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

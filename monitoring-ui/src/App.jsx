import { BrowserRouter, Routes, Route } from "react-router-dom";
import IncidentsPage from "./pages/IncidentsPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<IncidentsPage />} />
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

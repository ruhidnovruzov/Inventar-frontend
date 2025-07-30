// src/App.js
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import LoginPage from "./pages/Auth/Login";
import PrivateRoute from "./components/PrivateRoute"; // PrivateRoute komponentini import edin

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {/* Login səhifəsi üçün marşrut */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Panelini qorumaq üçün PrivateRoute istifadə edin */}
      {/* Bu, AdminPanel-ə daxil olmaq üçün token tələb edəcək */}
      <Route element={<PrivateRoute />}>
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage/LandingPage';
import OrgProfileForm from './pages/OrgProfile/OrgProfileForm';
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import OrgDashboard from './pages/Dashboard/OrgDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* ── Org profile completion ── */}
            <Route path="/complete-profile" element={<OrgProfileForm />} />

            {/* ── Client dashboard ── */}
            <Route path="/dashboard" element={<ClientDashboard />} />

            {/* ── Organization dashboard ── */}
            <Route path="/org-dashboard" element={<OrgDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

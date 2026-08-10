import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage/LandingPage';
import AuthPage from './pages/AuthPage/AuthPage';
import OrgProfileForm from './pages/OrgProfile/OrgProfileForm';
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import OrgDashboard from './pages/Dashboard/OrgDashboard';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* ── Org profile completion — requires auth token but not profileComplete ── */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute allowedRoles={['organization']} requireProfile={false}>
                <OrgProfileForm />
              </ProtectedRoute>
            }
          />

          {/* ── Protected: Client dashboard ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['client']} requireProfile={true}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Protected: Organization dashboard (requires profileComplete) ── */}
          <Route
            path="/org-dashboard"
            element={
              <ProtectedRoute allowedRoles={['organization']} requireProfile={true}>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

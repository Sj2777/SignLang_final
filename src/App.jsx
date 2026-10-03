import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/AuthPage/LoginPage';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import TranslatePage from './pages/TranslatePage/TranslatePage';
import ReverseTranslatePage from './pages/ReverseTranslatePage/ReverseTranslatePage';
import SpeedQuiz from './pages/SpeedQuiz/SpeedQuiz';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Dashboard Routes */}
            <Route 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/translate" element={<TranslatePage />} />
              <Route path="/reverse-translate" element={<ReverseTranslatePage />} />
              <Route path="/speed-quiz" element={<SpeedQuiz />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './hooks/useAuth.tsx'
import { ToastProvider } from './components/ui/Toast.tsx'
import ProtectedRoute from './components/auth/ProtectedRoute.tsx'
import LoginPage from './components/auth/LoginPage.tsx'
import SignupPage from './components/auth/SignupPage.tsx'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage.tsx'
import ResetPasswordPage from './components/auth/ResetPasswordPage.tsx'
import AppLayout from './components/layout/AppLayout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import MissionsPage from './pages/MissionsPage.tsx'
import AttributesPage from './pages/AttributesPage.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import AchievementsPage from './pages/AchievementsPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/missions" element={<MissionsPage />} />
              <Route path="/attributes" element={<AttributesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

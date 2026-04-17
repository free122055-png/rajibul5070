import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/Common';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Referral from './pages/Referral';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import History from './pages/History';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-bg text-text-p selection:bg-accent/30 font-sans">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected User Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/plans" element={
                <ProtectedRoute>
                  <Plans />
                </ProtectedRoute>
              } />
              <Route path="/deposit" element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              } />
              <Route path="/withdraw" element={
                <ProtectedRoute>
                  <Withdraw />
                </ProtectedRoute>
              } />
              <Route path="/referral" element={
                <ProtectedRoute>
                  <Referral />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#0d1117',
              color: '#e6edf3',
              border: '1px solid rgba(0, 242, 255, 0.2)',
              textTransform: 'uppercase',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.1em'
            }
          }} />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

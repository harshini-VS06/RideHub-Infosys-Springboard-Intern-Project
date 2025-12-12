import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './components/NotificationProvider';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './components/LoginPage';
import { ForgotPassword } from './components/ForgotPassword';
import { RegistrationRoleSelect } from './components/RegistrationRoleSelect';
import { DriverRegistrationForm } from './components/DriverRegistrationForm';
import { PassengerRegistrationForm } from './components/PassengerRegistrationForm';
import { OTPVerification } from './components/OTPVerification';
import { DriverDashboard } from './components/DriverDashboard';
import { CreateRide } from './components/CreateRide';
import { PassengerDashboard } from './components/PassengerDashboard';
import { AvailableRides } from './components/AvailableRides';
import { BookingConfirmation } from './components/BookingConfirmation';
import { AdminDashboard } from './components/AdminDashboard';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
        <div className="min-h-screen" style={{ fontFamily: 'Lora, serif' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<RegistrationRoleSelect />} />
            <Route path="/register/driver" element={<DriverRegistrationForm />} />
            <Route path="/register/passenger" element={<PassengerRegistrationForm />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            
            {/* Protected Driver Routes */}
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute requiredRole="DRIVER">
                  <DriverDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/driver/create-ride" 
              element={
                <ProtectedRoute requiredRole="DRIVER">
                  <CreateRide />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Route */}
            <Route 
              path="/admin/dashboard" 
              element={<AdminDashboard />}
            />
            
            {/* Protected Passenger Routes */}
            <Route 
              path="/passenger/dashboard" 
              element={
                <ProtectedRoute requiredRole="PASSENGER">
                  <PassengerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/passenger/available-rides" 
              element={
                <ProtectedRoute requiredRole="PASSENGER">
                  <AvailableRides />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/passenger/booking/:rideId" 
              element={
                <ProtectedRoute requiredRole="PASSENGER">
                  <BookingConfirmation />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </div>
      </Router>
      </NotificationProvider>
    </UserProvider>
  );
}

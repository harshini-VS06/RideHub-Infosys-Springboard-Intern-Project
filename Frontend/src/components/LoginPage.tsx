import { RoadBackground } from './RoadBackground';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'driver' | 'passenger'>('passenger');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use proper authentication for all users including admin
      const response = await authService.login({ email, password });
      
      toast.success('Login successful!');
      
      // Navigate to appropriate dashboard based on role
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'DRIVER') {
        navigate('/driver/dashboard');
      } else {
        navigate('/passenger/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send OTP for login
      await authService.initiateOTPLogin(email);
      
      toast.success('OTP sent to your email!');
      
      // Navigate to OTP verification page
      navigate('/verify-otp', {
        state: {
          email,
          purpose: 'OTP_LOGIN',
          role: selectedRole
        }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <RoadBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Logo and Tagline */}
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2" style={{ color: '#3D5A5D' }}>
              RideHub
            </h1>
            <p className="text-lg" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Your Journey Starts Here
            </p>
          </div>

          {/* Role Selection */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('driver')}
              className="flex-1 py-3 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: selectedRole === 'driver' ? '#EF8F31' : '#F9C05E',
                color: selectedRole === 'driver' ? '#FFFFFF' : '#3D5A5D',
                fontWeight: selectedRole === 'driver' ? 'bold' : 'normal',
                textAlign: 'center',
              }}
            >
              Driver Login
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('passenger')}
              className="flex-1 py-3 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: selectedRole === 'passenger' ? '#EF8F31' : '#F9C05E',
                color: selectedRole === 'passenger' ? '#FFFFFF' : '#3D5A5D',
                fontWeight: selectedRole === 'passenger' ? 'bold' : 'normal',
                textAlign: 'center',
              }}
            >
              Passenger Login
            </button>
          </div>

          {/* Login Method Selection */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className="flex-1 py-2 rounded-lg transition-all duration-300 text-sm"
              style={{
                backgroundColor: loginMethod === 'password' ? '#3D5A5D' : 'transparent',
                color: loginMethod === 'password' ? '#FFFFFF' : '#3D5A5D',
                border: `2px solid #3D5A5D`,
                fontWeight: loginMethod === 'password' ? 'bold' : 'normal',
              }}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className="flex-1 py-2 rounded-lg transition-all duration-300 text-sm"
              style={{
                backgroundColor: loginMethod === 'otp' ? '#3D5A5D' : 'transparent',
                color: loginMethod === 'otp' ? '#FFFFFF' : '#3D5A5D',
                border: `2px solid #3D5A5D`,
                fontWeight: loginMethod === 'otp' ? 'bold' : 'normal',
              }}
            >
              OTP Login
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleOTPLogin} className="space-y-5">
            <div>
              <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 transition-all"
                style={{ 
                  borderColor: '#3D5A5D',
                  backgroundColor: '#FFFFFF'
                }}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            {loginMethod === 'password' && (
              <>
                <div>
                  <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 transition-all pr-12"
                      style={{ 
                        borderColor: '#3D5A5D',
                        backgroundColor: '#FFFFFF'
                      }}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm transition-colors"
                    style={{ color: '#EF8F31', fontWeight: 'bold' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {loading ? (loginMethod === 'otp' ? 'SENDING OTP...' : 'LOGGING IN...') : loginMethod === 'otp' ? 'SEND OTP' : 'LOGIN'}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <p className="text-center mt-6" style={{ color: '#3D5A5D' }}>
            New user?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="transition-colors"
              style={{ color: '#EF8F31', fontWeight: 'bold' }}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

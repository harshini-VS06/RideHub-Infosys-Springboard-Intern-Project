import { RoadBackground } from './RoadBackground';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[@#$%^&+=!]/.test(password)) {
      return 'Password must contain at least one special character (@#$%^&+=!)';
    }
    return null;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.initiateForgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.verifyForgotPasswordOTP(email, otp);
      toast.success('OTP verified! Please set your new password');
      setStep('reset');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully! Please login with your new password');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await authService.initiateForgotPassword(email);
      toast.success('OTP resent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <RoadBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => step === 'email' ? navigate('/login') : setStep('email')}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={24} style={{ color: '#3D5A5D' }} />
            </button>
            <h2 className="text-2xl font-bold" style={{ color: '#3D5A5D' }}>
              {step === 'email' && 'Forgot Password'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'reset' && 'Reset Password'}
            </h2>
          </div>

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                Enter your registered email address. We'll send you an OTP to reset your password.
              </p>
              
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'SENDING...' : 'SEND OTP'}
              </button>
            </form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
              
              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all text-center text-2xl tracking-widest"
                  style={{ 
                    borderColor: '#3D5A5D',
                    backgroundColor: '#FFFFFF'
                  }}
                  placeholder="000000"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-sm transition-colors"
                style={{ color: '#EF8F31', fontWeight: 'bold' }}
              >
                Didn't receive OTP? Resend
              </button>
            </form>
          )}

          {/* Password Reset Step */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                Create a strong password with at least 8 characters, including uppercase, number, and special character.
              </p>
              
              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all pr-12"
                    style={{ 
                      borderColor: '#3D5A5D',
                      backgroundColor: '#FFFFFF'
                    }}
                    placeholder="Enter new password"
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

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all pr-12"
                    style={{ 
                      borderColor: '#3D5A5D',
                      backgroundColor: '#FFFFFF'
                    }}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

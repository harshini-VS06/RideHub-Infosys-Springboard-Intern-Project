import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RoadBackground } from './RoadBackground';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, formData, purpose, role } = location.state || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOtpComplete) {
      toast.error('Please enter the complete OTP');
      return;
    }

    const otpCode = otp.join('');
    setLoading(true);

    try {
      if (purpose === 'REGISTRATION') {
        // Complete registration with OTP
        const response = await authService.completeRegistration(formData, otpCode);
        toast.success('Registration successful! Welcome to RideHub!');
        
        // Navigate based on role
        if (response.user.role === 'DRIVER') {
          navigate('/driver/dashboard');
        } else {
          navigate('/passenger/dashboard');
        }
      } else if (purpose === 'LOGIN') {
        // Complete login with OTP
        const response = await authService.completeLogin(email, otpCode);
        toast.success('Login successful! Welcome back!');
        
        // Navigate based on role
        if (response.user.role === 'DRIVER') {
          navigate('/driver/dashboard');
        } else {
          navigate('/passenger/dashboard');
        }
      } else if (purpose === 'OTP_LOGIN') {
        // Complete OTP login (no password required)
        const response = await authService.verifyOTPLogin(email, otpCode);
        toast.success('Login successful! Welcome back!');
        
        // Navigate based on role
        if (response.user.role === 'DRIVER') {
          navigate('/driver/dashboard');
        } else {
          navigate('/passenger/dashboard');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      await authService.resendOTP(email, purpose);
      toast.success('OTP has been resent to your email');
      setOtp(['', '', '', '', '', '']);
      const firstInput = document.getElementById('otp-0');
      firstInput?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <RoadBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl mb-4" style={{ color: '#3D5A5D', fontWeight: 'bold', textAlign: 'center' }}>
            Email Verification
          </h2>
          
          <p className="mb-2" style={{ color: '#3D5A5D', opacity: 0.8, textAlign: 'center' }}>
            Enter the 6-digit OTP sent to
          </p>
          <p className="mb-8" style={{ color: '#EF8F31', fontWeight: 'bold', textAlign: 'center' }}>
            {email}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-center gap-2 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type={showOtp ? 'text' : 'password'}
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    disabled={loading}
                    className="w-12 h-14 text-center rounded-xl transition-all disabled:opacity-50"
                    style={{
                      border: `2px solid ${digit ? '#EF8F31' : '#3D5A5D'}`,
                      backgroundColor: '#FFFFFF',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      outline: 'none',
                    }}
                    autoComplete="off"
                  />
                ))}
              </div>
              
              {/* Toggle OTP Visibility - Simple Eye Icon */}
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={() => setShowOtp(!showOtp)}
                  className="p-2 transition-opacity hover:opacity-70 focus:outline-none"
                  style={{ color: '#3D5A5D' }}
                  title={showOtp ? 'Hide OTP' : 'Show OTP'}
                  aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
                >
                  {showOtp ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending || loading}
                className="transition-colors hover:underline disabled:opacity-50"
                style={{ color: '#EF8F31' }}
              >
                {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={!isOtpComplete || loading}
                className="w-full py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{
                  backgroundColor: isOtpComplete && !loading ? '#3D5A5D' : '#cccccc',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {loading ? 'VERIFYING...' : 'SUBMIT'}
              </button>
            </div>
          </form>  
        </div>
      </div>
    </div>
  );
}

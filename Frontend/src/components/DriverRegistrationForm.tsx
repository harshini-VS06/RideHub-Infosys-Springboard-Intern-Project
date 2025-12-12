import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import { RoadBackground } from './RoadBackground';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export function DriverRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    age: '',
    gender: '',
    carModel: '',
    licensePlate: '',
    capacity: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fileName, setFileName] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, contact: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Validate contact
    if (formData.contact.length !== 10) {
      toast.error('Contact must be exactly 10 digits');
      return;
    }

    setLoading(true);

    try {
      // Initiate registration and send OTP
      await authService.initiateRegistration({
        ...formData,
        role: 'DRIVER',
      });
      
      toast.success('OTP sent to your email!');
      
      // Navigate to OTP verification page with form data
      navigate('/verify-otp', {
        state: {
          email: formData.email,
          formData: {
            ...formData,
            role: 'DRIVER',
          },
          purpose: 'REGISTRATION',
          role: 'driver'
        }
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
      <RoadBackground />
      
      {/* Exit Button */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
        style={{ backgroundColor: '#EF8F31', color: '#FFFFFF' }}
      >
        <X size={24} />
      </button>
      
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl mb-8" style={{ color: '#3D5A5D', fontWeight: 'bold', textAlign: 'center' }}>
            Register as a Driver
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Email ID <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  placeholder="driver@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Name <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Password <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2"
                    style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                    placeholder="Min 8 characters"
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
                <p className="text-xs mt-1" style={{ color: '#EF8F31' }}>
                  Must include: 8+ chars, uppercase, number, special char
                </p>
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Contact <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={handleContactChange}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                  disabled={loading}
                />
                <p className="text-xs mt-1" style={{ color: '#3D5A5D', opacity: 0.7 }}>
                  {formData.contact.length}/10 digits
                </p>
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Age <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  placeholder="25"
                  min="18"
                  max="100"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                  Gender <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                Upload Original License PDF <span style={{ color: '#EF8F31' }}>*</span>
              </label>
              <label className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-solid"
                style={{ borderColor: '#EF8F31', backgroundColor: '#FFF8E1' }}
              >
                <Upload size={24} style={{ color: '#EF8F31' }} />
                <span style={{ color: '#3D5A5D' }}>
                  {fileName || 'Click to upload license'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div className="border-t-2 pt-5 mt-6" style={{ borderColor: '#F9C05E' }}>
              <h3 className="text-xl mb-4" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                Vehicle Details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                    Car Model <span style={{ color: '#EF8F31' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                    placeholder="Toyota Innova"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                    License Plate <span style={{ color: '#EF8F31' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                    placeholder="MH-01-AB-1234"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block mb-2" style={{ color: '#3D5A5D' }}>
                    Capacity <span style={{ color: '#EF8F31' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                    placeholder="4"
                    min="1"
                    max="20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
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
                {loading ? 'SENDING OTP...' : 'SEND OTP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

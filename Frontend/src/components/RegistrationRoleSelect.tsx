import { useNavigate } from 'react-router-dom';
import { RoadBackground } from './RoadBackground';
import { User, Car } from 'lucide-react';

export function RegistrationRoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <RoadBackground />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl text-center mb-8" style={{ color: '#3D5A5D' }}>
            I am registering as a...
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/register/driver')}
              className="w-full p-6 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-4"
              style={{
                backgroundColor: '#EF8F31',
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            >
              <Car size={32} />
              <span className="text-2xl">Driver</span>
            </button>

            <button
              onClick={() => navigate('/register/passenger')}
              className="w-full p-6 rounded-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-4"
              style={{
                backgroundColor: '#F7B34C',
                color: '#3D5A5D',
                fontWeight: 'bold',
              }}
            >
              <User size={32} />
              <span className="text-2xl">Passenger</span>
            </button>
          </div>

          <p className="text-center mt-8" style={{ color: '#3D5A5D' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/')}
              className="transition-colors"
              style={{ color: '#EF8F31', fontWeight: 'bold' }}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
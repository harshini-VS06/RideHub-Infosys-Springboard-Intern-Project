import { X, User, Mail, Phone, Calendar, Car, LogOut, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { TransactionHistory } from './TransactionHistory';
import { useState } from 'react';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const navigate = useNavigate();
  const userData = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'transactions'>('profile');

  const handleLogout = () => {
    authService.logout();
    onClose();
    navigate('/');
  };

  const handleClose = () => {
    console.log('ProfileSidebar: Close button clicked');
    onClose();
  };

  const handleOverlayClick = () => {
    console.log('ProfileSidebar: Overlay clicked');
    onClose();
  };

  console.log('ProfileSidebar render - isOpen:', isOpen);
  console.log('ProfileSidebar activeTab:', activeTab);
  console.log('ProfileSidebar userData:', userData);

  // If no user data, don't render anything
  if (!userData) {
    console.warn('ProfileSidebar: No user data found');
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={handleOverlayClick}
          style={{ cursor: 'pointer', zIndex: 40 }}
        />
      )}

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto"
        style={{
          fontFamily: 'Lora, serif',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out'
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
              {activeTab === 'profile' ? 'Profile' : 'Transactions'}
            </h2>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: '#F9C05E', cursor: 'pointer' }}
              aria-label="Close profile"
            >
              <X size={24} style={{ color: '#3D5A5D' }} />
            </button>
          </div>

          {/* Tab Navigation - Only show for PASSENGER */}
          {userData.role === 'PASSENGER' && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  console.log('Switching to profile tab');
                  setActiveTab('profile');
                }}
                className="flex-1 py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'profile' ? '#3D5A5D' : '#F9C05E',
                  color: activeTab === 'profile' ? '#FFFFFF' : '#3D5A5D',
                  fontWeight: 'bold',
                }}
              >
                <User size={16} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Switching to transactions tab');
                  setActiveTab('transactions');
                }}
                className="flex-1 py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: activeTab === 'transactions' ? '#3D5A5D' : '#F9C05E',
                  color: activeTab === 'transactions' ? '#FFFFFF' : '#3D5A5D',
                  fontWeight: 'bold',
                }}
              >
                <Receipt size={16} />
                Transactions
              </button>
            </div>
          )}

          {/* Active Tab Content */}
          {activeTab === 'profile' ? (
            <>
              {/* Profile Info Card */}
              <div className="mb-8 p-6 rounded-2xl" style={{ backgroundColor: '#FFF8E1' }}>
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: '#EF8F31', color: '#FFFFFF', fontWeight: 'bold' }}
                  >
                    {userData.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl mb-1" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      {userData.name || 'User'}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: '#F9C05E',
                        color: '#3D5A5D',
                        fontWeight: 'bold',
                      }}
                    >
                      {userData.role === 'DRIVER' ? 'Driver' : 'Passenger'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={18} style={{ color: '#EF8F31' }} />
                    <span style={{ color: '#3D5A5D' }}>{userData.email || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} style={{ color: '#EF8F31' }} />
                    <span style={{ color: '#3D5A5D' }}>{userData.contact || 'N/A'}</span>
                  </div>

                  {userData.age && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} style={{ color: '#EF8F31' }} />
                      <span style={{ color: '#3D5A5D' }}>{userData.age} years</span>
                    </div>
                  )}

                  {userData.gender && (
                    <div className="flex items-center gap-3">
                      <User size={18} style={{ color: '#EF8F31' }} />
                      <span style={{ color: '#3D5A5D' }}>{userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)}</span>
                    </div>
                  )}

                  {userData.role === 'DRIVER' && (
                    <div className="border-t pt-3 mt-3" style={{ borderColor: '#F9C05E' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <Car size={18} style={{ color: '#EF8F31' }} />
                        <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                          Vehicle Details
                        </span>
                      </div>
                      {userData.carModel && (
                        <p className="text-sm ml-7" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Model: {userData.carModel}
                        </p>
                      )}
                      {userData.licensePlate && (
                        <p className="text-sm ml-7" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          License: {userData.licensePlate}
                        </p>
                      )}
                      {userData.capacity && (
                        <p className="text-sm ml-7" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Capacity: {userData.capacity} seats
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                <LogOut size={20} />
                LOGOUT
              </button>
            </>
          ) : null}

          {/* Transaction History Tab */}
          {activeTab === 'transactions' && userData.role === 'PASSENGER' && (
            <div>
              <TransactionHistory />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

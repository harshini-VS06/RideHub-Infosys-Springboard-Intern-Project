import { X, AlertCircle, Phone, MapPin } from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const emergencyContacts = [
    { name: 'Police', number: '100' },
    { name: 'Ambulance', number: '108' },
    { name: 'Women Helpline', number: '1091' },
    { name: 'Emergency Services', number: '112' },
  ];

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const message = `Emergency! My current location: https://maps.google.com/?q=${latitude},${longitude}`;
          
          // Try to share via Web Share API
          if (navigator.share) {
            navigator.share({
              title: 'Emergency Location',
              text: message,
            });
          } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(message);
            alert('Location copied to clipboard!');
          }
        },
        (error) => {
          alert('Unable to get location. Please enable location services.');
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black opacity-50"
        style={{ zIndex: 60 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 61 }}>
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: '#F9C05E' }}
          >
            <X size={20} style={{ color: '#3D5A5D' }} />
          </button>

          <div className="text-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#DC2626' }}
            >
              <AlertCircle size={40} style={{ color: '#FFFFFF' }} />
            </div>
            <h2 className="text-2xl mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
              Emergency SOS
            </h2>
            <p style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Quick access to emergency services
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {emergencyContacts.map((contact, index) => (
              <button
                key={index}
                onClick={() => handleCall(contact.number)}
                className="w-full p-4 rounded-xl flex items-center justify-between transition-all hover:scale-105"
                style={{ backgroundColor: '#FFF8E1', border: '2px solid #F9C05E' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#EF8F31' }}
                  >
                    <Phone size={20} style={{ color: '#FFFFFF' }} />
                  </div>
                  <div className="text-left">
                    <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      {contact.name}
                    </p>
                    <p style={{ color: '#3D5A5D', opacity: 0.7 }}>
                      {contact.number}
                    </p>
                  </div>
                </div>
                <Phone size={20} style={{ color: '#EF8F31' }} />
              </button>
            ))}
          </div>

          <button
            onClick={shareLocation}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-3 transition-all hover:opacity-90"
            style={{
              backgroundColor: '#3D5A5D',
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          >
            <MapPin size={20} />
            SHARE MY LOCATION
          </button>
        </div>
      </div>
    </>
  );
}

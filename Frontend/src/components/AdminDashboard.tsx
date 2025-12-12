import React, { useState, useEffect } from 'react';
import { 
  Users, Car, CreditCard, AlertTriangle, TrendingUp, 
  DollarSign, MapPin, Calendar, Shield, Trash2, Ban, 
  CheckCircle, XCircle, Eye, LogOut, Menu, FileText,
  Activity, Star, Clock, UserCheck, Download
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import api from '../services/apiService';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'DRIVER' | 'PASSENGER';
  active: boolean;
  contact: string;
  createdAt: string;
}

interface Ride {
  id: number;
  driverId?: number;
  driver?: {
    id: number;
    name: string;
  };
  source: string;
  destination: string;
  rideDate: string;
  rideTime: string;
  totalSeats: number;
  availableSeats: number;
  farePerKm: number;
  distance: number;
  status: 'AVAILABLE' | 'FULL' | 'COMPLETED' | 'CANCELLED';
  tripStatus: 'SCHEDULED' | 'PICKING_UP' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

interface Booking {
  id: number;
  rideId: number;
  passengerId: number;
  seatsBooked: number;
  totalFare: number;
  status: string;
  bookingTime: string;
}

interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // States for data
  const [stats, setStats] = useState({
    totalRides: 0,
    activeUsers: 0,
    totalEarnings: 0,
    pendingDisputes: 0,
    activeDrivers: 0,
    activePassengers: 0,
    completedRides: 0,
    cancelledRides: 0
  });

  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load all data using the api service which handles auth automatically
      const [usersRes, ridesRes, bookingsRes, paymentsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/rides'),
        api.get('/admin/bookings'),
        api.get('/admin/payments')
      ]);

      setUsers(usersRes.data);
      setRides(ridesRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);

      // Calculate stats - FIXED VERSION
      const drivers = usersRes.data.filter((u: User) => u.role === 'DRIVER' && u.active);
      const passengers = usersRes.data.filter((u: User) => u.role === 'PASSENGER' && u.active);
      
      // Count RIDE statuses, not booking statuses - THIS IS THE FIX
      const completedRides = ridesRes.data.filter((r: Ride) => 
        r.status === 'COMPLETED' || r.tripStatus === 'COMPLETED'
      );
      const cancelledRides = ridesRes.data.filter((r: Ride) => 
        r.status === 'CANCELLED' || r.tripStatus === 'CANCELLED'
      );
      
      // Calculate earnings from completed bookings
      const completedBookings = bookingsRes.data.filter((b: Booking) => 
        b.status === 'COMPLETED'
      );
      const totalEarnings = completedBookings.reduce((sum: number, b: Booking) => 
        sum + b.totalFare, 0
      );

      setStats({
        totalRides: ridesRes.data.length,
        activeUsers: drivers.length + passengers.length,
        totalEarnings: totalEarnings,
        pendingDisputes: 0,
        activeDrivers: drivers.length,
        activePassengers: passengers.length,
        completedRides: completedRides.length,
        cancelledRides: cancelledRides.length
      });

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      
      await api.put(`/admin/users/${userId}/${user?.active ? 'block' : 'unblock'}`);

      toast.success(user?.active ? 'User blocked successfully' : 'User unblocked successfully');
      loadAdminData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);

      toast.success('User deleted successfully');
      loadAdminData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const StatCard = ({ icon: Icon, title, value, subtext, color }: any) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2" style={{ color }}>{value}</p>
          {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
        </div>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          <Icon size={32} className="text-white" />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Car} 
          title="Total Rides" 
          value={stats.totalRides} 
          subtext={`${stats.completedRides} completed`}
          color="#3D5A5D" 
        />
        <StatCard 
          icon={Users} 
          title="Active Users" 
          value={stats.activeUsers} 
          subtext={`${stats.activeDrivers} drivers, ${stats.activePassengers} passengers`}
          color="#EF8F31" 
        />
        <StatCard 
          icon={DollarSign} 
          title="Total Earnings" 
          value={`₹${stats.totalEarnings.toLocaleString()}`} 
          subtext="All time"
          color="#EF8F31" 
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Cancelled Rides" 
          value={stats.cancelledRides} 
          subtext={`${stats.totalRides > 0 ? ((stats.cancelledRides / stats.totalRides) * 100).toFixed(1) : 0}% cancellation rate`}
          color="#EF8F31" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3D5A5D' }}>Recent Rides</h3>
          <div className="space-y-3">
            {rides.slice(0, 5).map(ride => {
              const pricePerSeat = ride.distance && ride.farePerKm 
                ? (ride.distance * ride.farePerKm) / ride.totalSeats
                : 0;
              
              return (
                <div key={ride.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Ride #{ride.id}</p>
                    <p className="text-xs text-gray-600">
                      {ride.source} → {ride.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{pricePerSeat.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ride.status === 'COMPLETED' || ride.tripStatus === 'COMPLETED'
                        ? 'bg-green-100 text-green-700' :
                      ride.tripStatus === 'IN_PROGRESS' || ride.tripStatus === 'PICKING_UP'
                        ? 'bg-blue-100 text-blue-700' :
                      ride.status === 'CANCELLED' || ride.tripStatus === 'CANCELLED'
                        ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ride.tripStatus || ride.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#3D5A5D' }}>Platform Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={24} />
                <span className="font-medium">Completed Rides</span>
              </div>
              <span className="font-bold text-lg">{stats.completedRides}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={24} />
                <span className="font-medium">Cancelled Rides</span>
              </div>
              <span className="font-bold text-lg">{stats.cancelledRides}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="text-orange-600" size={24} />
                <span className="font-medium">Cancellation Rate</span>
              </div>
              <span className="font-bold text-lg">
                {stats.totalRides > 0 ? ((stats.cancelledRides / stats.totalRides) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold" style={{ color: '#3D5A5D' }}>User Management</h3>
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 text-white rounded-lg hover:bg-opacity-90 transition flex items-center gap-2"
          style={{ backgroundColor: '#3D5A5D' }}
        >
          <Download size={18} />
          Export Report
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2" style={{ borderColor: '#3D5A5D' }}>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">#{user.id}</td>
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm">{user.contact}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'DRIVER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.active ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleBlockUser(user.id)}
                      className={`p-2 rounded-lg transition ${
                        !user.active
                          ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                      title={!user.active ? 'Unblock User' : 'Block User'}
                    >
                      {!user.active ? <CheckCircle size={18} /> : <Ban size={18} />}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRides = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-6" style={{ color: '#3D5A5D' }}>Ride Management</h3>
      <p className="text-gray-600 mb-6">Track all ride activities</p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2" style={{ borderColor: '#EF8F31' }}>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Driver ID</th>
              <th className="px-4 py-3 text-left">Route</th>
              <th className="px-4 py-3 text-left">Seats</th>
              <th className="px-4 py-3 text-left">Price/Seat</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Departure</th>
            </tr>
          </thead>
          <tbody>
            {rides.map(ride => {
              // Calculate price per seat - FIXED
              const pricePerSeat = ride.distance && ride.farePerKm 
                ? (ride.distance * ride.farePerKm) / ride.totalSeats
                : 0;
              
              // Format departure time - FIXED
              const departureTime = `${ride.rideDate}T${ride.rideTime}`;
              
              return (
                <tr key={ride.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">#{ride.id}</td>
                  <td className="px-4 py-3">Driver #{ride.driver?.id || ride.driverId || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-500" />
                      {ride.source} → {ride.destination}
                    </div>
                  </td>
                  <td className="px-4 py-3">{ride.availableSeats}</td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    ₹{pricePerSeat > 0 ? pricePerSeat.toFixed(2) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ride.status === 'COMPLETED' || ride.tripStatus === 'COMPLETED' 
                        ? 'bg-green-100 text-green-700' :
                      ride.status === 'CANCELLED' || ride.tripStatus === 'CANCELLED'
                        ? 'bg-red-100 text-red-700' :
                      ride.tripStatus === 'IN_PROGRESS' || ride.tripStatus === 'PICKING_UP'
                        ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ride.tripStatus || ride.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {departureTime !== 'Invalid Date' 
                      ? new Date(departureTime).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Invalid Date'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-6" style={{ color: '#3D5A5D' }}>Payment Transactions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b-2" style={{ borderColor: '#EF8F31' }}>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Booking ID</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">#{payment.id}</td>
                <td className="px-4 py-3 font-mono">{payment.bookingId ? `B-${payment.bookingId}` : 'N/A'}</td>
                <td className="px-4 py-3 font-bold text-green-600">₹{payment.amount}</td>
                <td className="px-4 py-3">{payment.paymentMethod}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-2xl font-bold mb-6" style={{ color: '#3D5A5D' }}>Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => toast.info('Generating revenue report...')}
            className="p-6 border-2 rounded-xl hover:shadow-lg transition" 
            style={{ borderColor: '#3D5A5D' }}
          >
            <FileText size={32} className="mb-3" style={{ color: '#3D5A5D' }} />
            <h4 className="font-bold mb-2">Revenue Report</h4>
            <p className="text-sm text-gray-600">Total earnings: ₹{stats.totalEarnings.toLocaleString()}</p>
          </button>
          <button 
            onClick={() => toast.info('Generating user activity report...')}
            className="p-6 border-2 rounded-xl hover:shadow-lg transition" 
            style={{ borderColor: '#EF8F31' }}
          >
            <Users size={32} className="mb-3" style={{ color: '#3D5A5D' }} />
            <h4 className="font-bold mb-2">User Activity</h4>
            <p className="text-sm text-gray-600">Active users: {stats.activeUsers}</p>
          </button>
          <button 
            onClick={() => toast.info('Generating ride analytics...')}
            className="p-6 border-2 rounded-xl hover:shadow-lg transition" 
            style={{ borderColor: '#EF8F31' }}
          >
            <Car size={32} className="mb-3" style={{ color: '#3D5A5D' }} />
            <h4 className="font-bold mb-2">Ride Analytics</h4>
            <p className="text-sm text-gray-600">Total rides: {stats.totalRides}</p>
          </button>
          <button 
            onClick={() => toast.info('Generating cancellation report...')}
            className="p-6 border-2 rounded-xl hover:shadow-lg transition" 
            style={{ borderColor: '#EF8F31' }}
          >
            <AlertTriangle size={32} className="mb-3" style={{ color: '#3D5A5D' }} />
            <h4 className="font-bold mb-2">Cancellation Report</h4>
            <p className="text-sm text-gray-600">Cancelled: {stats.cancelledRides} rides</p>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div 
        className="w-64 h-screen shadow-xl flex flex-col fixed left-0 top-0 bottom-0 z-10"
        style={{ backgroundColor: '#3D5A5D' }}
      >
        <div className="p-6 flex items-center justify-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {[
            { id: 'overview', icon: TrendingUp, label: 'Overview' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'rides', icon: Car, label: 'Rides' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
            { id: 'reports', icon: FileText, label: 'Reports' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeTab === item.id 
                  ? 'bg-white text-gray-900' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 flex-shrink-0 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-600 transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto" style={{ marginLeft: '256px' }}>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#3D5A5D' }}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'rides' && 'Ride Management'}
              {activeTab === 'payments' && 'Payment Transactions'}
              {activeTab === 'reports' && 'Analytics & Reports'}
            </h1>
            <p className="text-gray-600">
              {activeTab === 'overview' && 'Monitor your platform performance and key metrics'}
              {activeTab === 'users' && 'Manage drivers and passengers'}
              {activeTab === 'rides' && 'Track all ride activities'}
              {activeTab === 'payments' && 'View all payment transactions'}
              {activeTab === 'reports' && 'Generate comprehensive reports'}
            </p>
          </div>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'rides' && renderRides()}
          {activeTab === 'payments' && renderPayments()}
          {activeTab === 'reports' && renderReports()}
        </div>
      </div>
    </div>
  );
}

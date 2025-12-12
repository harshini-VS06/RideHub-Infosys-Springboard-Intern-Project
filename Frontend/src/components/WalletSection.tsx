import { useState, useEffect } from 'react';
import { Wallet, Lock, TrendingUp, Loader2, Info, History, ArrowDownCircle } from 'lucide-react';
import { walletService, WalletData } from '../services/walletService';
import { TransactionHistory } from './TransactionHistory';
import { WithdrawalForm } from './WithdrawalForm';
import { toast } from 'sonner';

export function WalletSection() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdraw'>('overview');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await walletService.getMyWallet();
      setWallet(data);
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to fetch wallet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin" size={32} style={{ color: '#EF8F31' }} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-8">
        <p style={{ color: '#3D5A5D', opacity: 0.6 }}>Failed to load wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
          style={{
            backgroundColor: activeTab === 'overview' ? '#3D5A5D' : '#F9C05E',
            color: activeTab === 'overview' ? '#FFFFFF' : '#3D5A5D',
            fontWeight: 'bold',
          }}
        >
          <Wallet size={18} />
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className="px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
          style={{
            backgroundColor: activeTab === 'transactions' ? '#3D5A5D' : '#F9C05E',
            color: activeTab === 'transactions' ? '#FFFFFF' : '#3D5A5D',
            fontWeight: 'bold',
          }}
        >
          <History size={18} />
          History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className="px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2"
          style={{
            backgroundColor: activeTab === 'withdraw' ? '#3D5A5D' : '#F9C05E',
            color: activeTab === 'withdraw' ? '#FFFFFF' : '#3D5A5D',
            fontWeight: 'bold',
          }}
        >
          <ArrowDownCircle size={18} />
          Withdraw
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' ? (
        <>
          {/* Wallet Cards */}
          <div className="grid md:grid-cols-3 gap-4">
        {/* Locked Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#FFF8E1' }}>
              <Lock size={24} style={{ color: '#EF8F31' }} />
            </div>
            <h3 className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Locked Balance
            </h3>
          </div>
          <p className="text-3xl mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
            ₹{wallet.lockedBalance.toFixed(2)}
          </p>
          <p className="text-xs" style={{ color: '#3D5A5D', opacity: 0.6 }}>
            Will be available after ride completion
          </p>
        </div>

        {/* Available Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#E8F5E9' }}>
              <Wallet size={24} style={{ color: '#4CAF50' }} />
            </div>
            <h3 className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Available Balance
            </h3>
          </div>
          <p className="text-3xl mb-2" style={{ color: '#4CAF50', fontWeight: 'bold' }}>
            ₹{wallet.availableBalance.toFixed(2)}
          </p>
          <p className="text-xs" style={{ color: '#3D5A5D', opacity: 0.6 }}>
            Ready for withdrawal
          </p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: '#E3F2FD' }}>
              <TrendingUp size={24} style={{ color: '#2196F3' }} />
            </div>
            <h3 className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Total Earnings
            </h3>
          </div>
          <p className="text-3xl mb-2" style={{ color: '#2196F3', fontWeight: 'bold' }}>
            ₹{wallet.totalEarnings.toFixed(2)}
          </p>
          <p className="text-xs" style={{ color: '#3D5A5D', opacity: 0.6 }}>
            Lifetime earnings
          </p>
        </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info size={20} style={{ color: '#2196F3', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <h4 className="text-sm mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
              How HubWallet Works
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              <li>• <strong>Locked Balance:</strong> Payments received but locked until ride completion</li>
              <li>• <strong>Available Balance:</strong> Funds ready for withdrawal after rides are completed</li>
              <li>• <strong>Total Earnings:</strong> All-time earnings from completed rides</li>
            </ul>
          </div>
        </div>
          </div>

          {/* Withdraw Button (Future Implementation) */}
          <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-lg mb-4" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          Withdraw Funds
        </h3>
        {wallet.availableBalance > 0 ? (
          <button
            type="button"
            onClick={() => toast.info('Withdrawal feature coming soon!')}
            className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90"
            style={{
              backgroundColor: '#3D5A5D',
              color: '#FFFFFF',
              fontWeight: 'bold',
            }}
          >
            Withdraw ₹{wallet.availableBalance.toFixed(2)}
          </button>
        ) : (
          <div className="text-center py-4">
            <p style={{ color: '#3D5A5D', opacity: 0.6 }}>
              No funds available for withdrawal yet
            </p>
            <p className="text-sm mt-2" style={{ color: '#3D5A5D', opacity: 0.5 }}>
              Complete rides to unlock your earnings
            </p>
          </div>
        )}
          </div>

          {/* Last Updated */}
          <div className="text-center">
            <p className="text-xs" style={{ color: '#3D5A5D', opacity: 0.5 }}>
              Last updated: {new Date(wallet.updatedAt).toLocaleString()}
            </p>
          </div>
        </>
      ) : activeTab === 'transactions' ? (
        <TransactionHistory />
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h3 className="text-xl mb-4" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
            Withdraw Funds
          </h3>
          <WithdrawalForm 
            availableBalance={wallet.availableBalance} 
            onSuccess={fetchWallet}
          />
        </div>
      )}
    </div>
  );
}

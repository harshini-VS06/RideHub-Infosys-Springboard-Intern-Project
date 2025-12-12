import { useState } from 'react';
import { walletService } from '../services/paymentService';
import { toast } from 'sonner';

interface WithdrawalFormProps {
  availableBalance: number;
  onSuccess: () => void;
}

export function WithdrawalForm({ availableBalance, onSuccess }: WithdrawalFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    bankAccount: '',
    ifscCode: '',
    accountHolderName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (amount > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await walletService.withdraw({
        amount,
        bankAccount: formData.bankAccount,
        ifscCode: formData.ifscCode,
        accountHolderName: formData.accountHolderName,
      });
      
      toast.success(response.message);
      setFormData({ amount: '', bankAccount: '', ifscCode: '', accountHolderName: '' });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          Amount *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2"
          style={{ borderColor: '#3D5A5D' }}
          placeholder="Enter amount"
          required
          max={availableBalance}
        />
        <p className="text-sm mt-1" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Available: ₹{availableBalance.toFixed(2)}
        </p>
      </div>

      <div>
        <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          Account Holder Name *
        </label>
        <input
          type="text"
          value={formData.accountHolderName}
          onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2"
          style={{ borderColor: '#3D5A5D' }}
          placeholder="As per bank records"
          required
        />
      </div>

      <div>
        <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          Bank Account Number *
        </label>
        <input
          type="text"
          value={formData.bankAccount}
          onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border-2"
          style={{ borderColor: '#3D5A5D' }}
          placeholder="Enter account number"
          required
        />
      </div>

      <div>
        <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          IFSC Code *
        </label>
        <input
          type="text"
          value={formData.ifscCode}
          onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
          className="w-full px-4 py-3 rounded-xl border-2"
          style={{ borderColor: '#3D5A5D' }}
          placeholder="e.g., SBIN0001234"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90"
        style={{
          backgroundColor: '#3D5A5D',
          color: '#FFFFFF',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Processing...' : 'Withdraw Funds'}
      </button>
    </form>
  );
}
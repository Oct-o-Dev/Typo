// client/src/components/OtpForm.tsx
'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

interface OtpFormProps {
  email: string;
  registrationId: string;
  onClose: () => void;
  onGoBack: () => void; // --- NEW FIX: Add a prop for the go back action ---
}

export default function OtpForm({ email, registrationId, onClose, onGoBack }: OtpFormProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-registration', { registrationId, otp });
      const { token, username, userId, isGuest } = response.data; // <-- Get userId
      login(token, username, userId, isGuest); // <-- Pass userId to store
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Verify Your Email</h2>
        <p className="text-gray-400 mt-2">
          We've sent a 6-digit code to <span className="font-semibold text-yellow-400">{email}</span>.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">Verification Code</label>
          <Input 
            id="otp" 
            type="text" 
            placeholder="123456" 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)}
            className="text-center text-2xl tracking-[0.5em]"
            maxLength={6}
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </Button>
      </form>

      {/* --- NEW FIX: Add the Go Back button --- */}
      <div className="text-center">
        <p className="text-gray-400 text-sm">
          Entered the wrong email?{' '}
          <button onClick={onGoBack} className="font-semibold text-yellow-400 hover:underline">
            Go Back
          </button>
        </p>
      </div>
    </div>
  );
}
// ...existing code...
'use client';

import { useState, FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

export default function LoginForm({ onSwitchToSignUp, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, username, userId, isGuest } = response.data; // <-- Get userId
      login(token, username, userId, isGuest); // <-- Pass userId to store
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW FIX: Add handler for Guest Login ---
  const handleGuestLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
        const response = await api.post('/auth/guest');
        const { token, username, userId, isGuest } = response.data;
        login(token, username, userId, isGuest);
        onClose();
    } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to create guest session.');
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Sign In</h2>
        <p className="text-gray-400 mt-2">Welcome back! Enter your details to continue.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
      
      {/* --- NEW FIX: Add divider and Guest Login button --- */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-500">
            OR
            </span>
        </div>
      </div>

      <Button onClick={handleGuestLogin} variant="secondary" className="w-full" size="lg" disabled={isLoading}>
        Continue as Guest
      </Button>
      
      <div className="text-center">
        <p className="text-gray-400">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignUp} className="font-semibold text-yellow-400 hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
// ...existing code...
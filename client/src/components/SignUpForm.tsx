// client/src/components/SignUpForm.tsx
'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import api from '@/services/api';
import { AxiosError } from 'axios';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onShowOtp: (email: string, registrationId: string) => void;
}

export default function SignUpForm({ onSwitchToLogin, onShowOtp }: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- NEW FIX: Add client-side password validation ---
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return; // Stop the submission
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/start-registration', { email, password, username });
      onShowOtp(email, response.data.registrationId);
    } catch (err) { // FIX: Type-safe error handling
          if (err instanceof AxiosError) {
            setError(err.response?.data?.message || 'An unexpected error occurred.');
          } else {
            setError('An unexpected error occurred.');
          }
        } finally {
          setIsLoading(false);
        }
      };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Create an Account</h2>
        <p className="text-gray-400 mt-2">Join the arena and start your journey.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div>
          <label htmlFor="username-signup" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
          <Input id="username-signup" type="text" placeholder="Your display name" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <Input id="email-signup" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <Input id="password-signup" type="password" placeholder="•••••••• (min. 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Account'}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-gray-400">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-semibold text-yellow-400 hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
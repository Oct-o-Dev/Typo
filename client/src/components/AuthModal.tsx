// client/src/components/AuthModal.tsx
'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import OtpForm from './OtpForm';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup';
}

type ModalView = 'login' | 'signup' | 'otp';

export default function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<ModalView>(initialView);
  const [registrationData, setRegistrationData] = useState({ email: '', registrationId: '' });

  // When the modal is reopened, reset its view to the initial one
  useEffect(() => {
    if (isOpen) {
        setView(initialView);
    }
  }, [isOpen, initialView]);


  if (!isOpen) return null;

  const handleSwitchView = (newView: ModalView) => setView(newView);
  const handleShowOtpForm = (email: string, registrationId: string) => {
    setRegistrationData({ email, registrationId });
    setView('otp');
  };

  const renderContent = () => {
    switch (view) {
      case 'signup':
        return <SignUpForm onSwitchToLogin={() => handleSwitchView('login')} onShowOtp={handleShowOtpForm} />;
      case 'otp':
        // --- NEW FIX: Pass the handleSwitchView function to the OTP form ---
        return <OtpForm {...registrationData} onClose={onClose} onGoBack={() => handleSwitchView('signup')} />;
      case 'login':
      default:
        return <LoginForm onSwitchToSignUp={() => handleSwitchView('signup')} onClose={onClose} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-md relative shadow-2xl shadow-yellow-400/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        {renderContent()}
      </div>
    </div>
  );
}
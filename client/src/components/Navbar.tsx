'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Keyboard } from 'lucide-react';
import AuthModal from './AuthModal';
import { Button } from './Button';

export default function Navbar() {
  const { isLoggedIn, username, logout } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'login' | 'signup'>('login');

  const openModal = (view: 'login' | 'signup') => {
    setModalView(view);
    setIsModalOpen(true);
  };

  return (
    <>
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Keyboard className="text-yellow-400" size={28} />
              <span className="text-2xl font-bold text-white">Typo</span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isLoggedIn ? (
                <>
                  <span className="text-gray-300 hidden sm:block">Welcome, <span className="font-bold text-white">{username}</span></span>
                  <Button onClick={logout} variant="destructive">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => openModal('login')} variant="ghost">Sign In</Button>
                  <Button onClick={() => openModal('signup')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialView={modalView} 
      />
    </>
  );
}


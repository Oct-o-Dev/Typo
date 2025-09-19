'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

// Define the shape of the data we expect for opponents
interface Opponent {
  id: string;
  username: string;
  rating: number;
}

interface GameClientProps {
  matchId: string;
  initialText: string;
  initialOpponent: Opponent;
}

export default function GameClient({ matchId, initialText, initialOpponent }: GameClientProps) {
  const { socket } = useSocket();
  const { username, userId, isLoggedIn } = useAuthStore();
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);

  const [textToType] = useState<string>(initialText);
  const [userInput, setUserInput] = useState('');
  const [opponentProgress, setOpponentProgress] = useState(0);

  const startTime = useRef<number | null>(null);
  const [wpm, setWpm] = useState(0);

  // This effect checks when our auth state has been loaded from localStorage.
  // It's a crucial step to prevent race conditions with the userId.
  useEffect(() => {
    if (isLoggedIn) {
      setIsStoreHydrated(true);
    }
  }, [isLoggedIn]);

  // Handles all keyboard input for the game.
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default browser actions for typing keys
    if (e.key.length === 1 || e.key === 'Backspace') {
        e.preventDefault();
    }
    
    // Start the timer on the very first keypress
    if (!startTime.current && e.key.length === 1) {
        startTime.current = Date.now();
    }

    if (e.key.length === 1) {
      setUserInput((prev) => prev + e.key);
    } else if (e.key === 'Backspace') {
      setUserInput((prev) => prev.slice(0, -1));
    }
  }, []);

  // Attaches the keyboard listener to the window.
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // This effect handles SETUP: joining the room and listening for opponent progress.
  // It runs only when the socket connects and our user data is ready.
  useEffect(() => {
    if (socket && isStoreHydrated) {
      // THE FIX: Tell the server to add this new connection to the correct room.
      socket.emit('joinMatchRoom', matchId);

      const handleOpponentProgress = (data: { playerId: string, progress: number }) => {
        if (userId && data.playerId !== userId) {
          setOpponentProgress(data.progress);
        }
      };

      socket.on('opponentProgress', handleOpponentProgress);

      // Cleanup function to remove the listener when the component unmounts
      return () => {
        socket.off('opponentProgress', handleOpponentProgress);
      };
    }
  }, [socket, matchId, userId, isStoreHydrated]);

  // This separate effect handles ACTIONS: emitting player progress and calculating WPM.
  // It runs every time the user types a character.
  useEffect(() => {
    if (socket && isStoreHydrated) {
      const progress = userInput.length;
      socket.emit('playerProgress', { matchId, progress });

      if (startTime.current) {
        const elapsedTimeInMinutes = (Date.now() - startTime.current) / 60000;
        const wordsTyped = userInput.length / 5; // Average word length is 5
        setWpm(elapsedTimeInMinutes > 0 ? Math.round(wordsTyped / elapsedTimeInMinutes) : 0);
      }
    }
  }, [socket, userInput, matchId, isStoreHydrated]);


  // Renders the text, cursors, and opponent's ghost cursor.
  const renderText = () => {
    return textToType.split('').map((char, index) => {
      let colorClass = 'text-gray-500';
      let isCursor = index === userInput.length;
      let isOpponentCursor = index === opponentProgress && index !== userInput.length;
      
      if (index < userInput.length) {
        colorClass = userInput[index] === char ? 'text-white' : 'text-red-500';
      }

      return (
        <span key={index} className={`relative transition-colors duration-150 ${colorClass} ${isCursor ? 'bg-yellow-400 !text-black rounded-sm' : ''}`}>
           {isOpponentCursor && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-400 opacity-70 animate-pulse" />}
           {char === ' ' && isCursor ? <span className="absolute inset-0 bg-yellow-400 !text-black rounded-sm opacity-50"></span> : null}
           {char}
        </span>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-900 border border-gray-800 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{username} (You)</h2>
          <p className="text-yellow-400 font-semibold">{wpm} WPM</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-white">{initialOpponent.username}</h2>
          <p className="text-gray-400">Rating: {initialOpponent.rating}</p>
        </div>
      </div>
      
      <div className="text-2xl font-mono p-4 bg-black rounded-md leading-relaxed tracking-wider select-none">
        {renderText()}
      </div>

       <div className="mt-4 text-center text-sm text-gray-500">
         <p>Start typing to begin the race!</p>
       </div>
    </div>
  );
}
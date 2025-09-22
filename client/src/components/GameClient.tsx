'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import ResultsModal from './ResultsModal';
import { useRouter } from 'next/navigation';
import { Howl } from 'howler'; // Import Howler for sound effects

// --- NEW: Sound Effect Definitions ---
const keySound = new Howl({
  src: ['https://actions.google.com/sounds/v1/ui/key_press_standard.ogg']
});
const errorSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/ui/error_light.ogg'],
  volume: 0.5
});

// ... (Interfaces are correct and remain the same)
interface Opponent { id: string; username: string; rating: number; }
interface GameMode { mode: 'time' | 'words'; duration: number; }
interface GameClientProps { matchId: string; initialText: string; initialOpponent: Opponent; gameMode: GameMode; }

export default function GameClient({ matchId, initialText, initialOpponent, gameMode }: GameClientProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const { username, userId, isLoggedIn } = useAuthStore();
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);

  const [textToType] = useState<string>(initialText + '\u00A0'); 
  const [userInput, setUserInput] = useState('');
  const [opponentProgress, setOpponentProgress] = useState(0);
  
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'running' | 'finished'>('waiting');
  const [countdown, setCountdown] = useState(5);
  
  const [remainingTime, setRemainingTime] = useState(gameMode.duration);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);

  const startTime = useRef<number | null>(null);
  const [wpm, setWpm] = useState(0);

  // --- NEW: State for visual error feedback ---
  const [isError, setIsError] = useState(false);

  // --- THE DEFINITIVE FIX: Calculate final stats inside this function ---
  const finishGame = useCallback(() => {
    if (isFinished || !socket) return;
    setIsFinished(true);

    // Ensure we don't divide by zero if the user didn't type anything
    if (!startTime.current || userInput.length === 0) {
        socket.emit('playerFinished', { matchId, wpm: 0, accuracy: 0 });
        return;
    }
    
    // Calculate final WPM at the moment the game ends
    const finalElapsedTimeInMinutes = (Date.now() - startTime.current) / 60000;
    const finalWordsTyped = userInput.length / 5;
    const finalWpm = Math.round(finalWordsTyped / finalElapsedTimeInMinutes);

    // Calculate final accuracy
    const correctChars = textToType.split('').reduce((acc, char, i) => acc + (userInput[i] === char ? 1 : 0), 0);
    const accuracy = Math.round((correctChars / userInput.length) * 100) || 0;
    
    console.log(`Submitting final score! WPM: ${finalWpm}, Accuracy: ${accuracy}%`);
    socket.emit('playerFinished', { matchId, wpm: finalWpm, accuracy });
  }, [isFinished, socket, matchId, textToType, userInput]); // Removed wpm from dependencies

  useEffect(() => {
    if (isLoggedIn) setIsStoreHydrated(true);
  }, [isLoggedIn]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'running' || isFinished) return;
    
    // --- UPDATED to handle finishing a "words" match ---
    // We check if the NEXT character they type will finish the text
    if (userInput.length === textToType.length - 2 && e.key.length === 1) {
        if (gameMode.mode === 'words') {
            // A tiny delay ensures the last character is registered before finishing
            setTimeout(() => finishGame(), 50);
        }
    }
    
    if (userInput.length >= textToType.length) return;
    
    if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
    
    if (!startTime.current && e.key.length === 1) {
      startTime.current = Date.now();
      if (socket) socket.emit('playerStartedTyping', matchId);
    }

    if (e.key.length === 1) {
      const typedChar = e.key;
      const expectedChar = textToType[userInput.length];
      if (typedChar === expectedChar) {
        keySound.play();
        setIsError(false);
      } else {
        errorSound.play();
        setIsError(true);
        setTimeout(() => setIsError(false), 200);
      }
      setUserInput((prev) => prev + typedChar);
    } else if (e.key === 'Backspace') {
      setIsError(false);
      setUserInput((prev) => prev.slice(0, -1));
    }
  }, [userInput, textToType, gameState, isFinished, socket, matchId, finishGame, gameMode.mode]);

  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);


  // Main WebSocket listener setup
  useEffect(() => {
    // ... (This is now perfect and remains the same)
    if (socket && isStoreHydrated) {
      socket.emit('joinMatchRoom', matchId);
      const handlePreGameCountdown = (data: { countdown: number }) => { setGameState('countdown'); setCountdown(data.countdown); };
      const handleGameStart = () => setGameState('running');
      const handleMatchAborted = (data: { message: string }) => { alert(data.message); router.push('/'); };
      const handleOpponentProgress = (data: { playerId: string, progress: number }) => { if (userId && data.playerId !== userId) setOpponentProgress(data.progress); };
      const handleTimerUpdate = (data: { remainingTime: number }) => setRemainingTime(data.remainingTime);
      const handleGameOver = () => {
        finishGame();
        setTimeout(() => { if (socket) socket.emit('requestResults', matchId); }, 1000);
      };
      const handleMatchResult = (data: any) => setResults(data);

      socket.on('preGameCountdown', handlePreGameCountdown);
      socket.on('gameStart', handleGameStart);
      socket.on('matchAborted', handleMatchAborted);
      socket.on('opponentProgress', handleOpponentProgress);
      socket.on('timerUpdate', handleTimerUpdate);
      socket.on('gameOver', handleGameOver);
      socket.on('matchResult', handleMatchResult);

      return () => {
        socket.off('preGameCountdown', handlePreGameCountdown);
        socket.off('gameStart', handleGameStart);
        socket.off('matchAborted', handleMatchAborted);
        socket.off('opponentProgress', handleOpponentProgress);
        socket.off('timerUpdate', handleTimerUpdate);
        socket.off('gameOver', handleGameOver);
        socket.off('matchResult', handleMatchResult);
      };
    }
  }, [socket, matchId, userId, isStoreHydrated, finishGame, router]);

  // Effect for emitting progress and calculating LIVE WPM for display
  useEffect(() => {
    // ... (This is now perfect and remains the same)
    if (socket && isStoreHydrated && !isFinished) {
      socket.emit('playerProgress', { matchId, progress: userInput.length });
      if (startTime.current) {
        const elapsedTimeInMinutes = (Date.now() - startTime.current) / 60000;
        const wordsTyped = userInput.length / 5;
        setWpm(elapsedTimeInMinutes > 0 ? Math.round(wordsTyped / elapsedTimeInMinutes) : 0);
      }
    }
  }, [socket, userInput, matchId, isStoreHydrated, isFinished]);

  const renderText = () => {
    // ... (renderText logic is the same)
    return textToType.split('').map((char, index) => {
      let colorClass = 'text-gray-500';
      if (index < userInput.length) {
        colorClass = userInput[index] === char ? 'text-white' : 'text-red-500';
      }
      const isMyCursor = index === userInput.length;
      const isOpponentCursor = index === opponentProgress && !isMyCursor;
      const charToRender = char === ' ' ? '\u00A0' : char;
      const isCursorOnSpace = isMyCursor && char === ' ';
      return (
        <span key={index} className={`relative ${colorClass} ${isCursorOnSpace ? 'bg-white/10 rounded-sm' : ''}`}>
           {isMyCursor && !isCursorOnSpace && (
             <span className="absolute left-0 top-0 h-full w-0.5 bg-yellow-400 animate-pulse" />
           )}
           {isOpponentCursor && (
             <span className="absolute left-0 top-0 h-full w-0.5 bg-gray-500" />
           )}
           {charToRender}
        </span>
      );
    });
  };
  
  const myProgress = (userInput.length / textToType.length) * 100;
  const opponentProgressBar = (opponentProgress / textToType.length) * 100;

  return (
    <>
    {/* --- NEW: Add a conditional class for the error shake --- */}
      <div className={`flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] relative ${isError ? 'animate-shake' : ''}`}>
        
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] relative">
        
        {/* --- Countdown Overlay --- */}
        {gameState === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-9xl font-bold text-white drop-shadow-lg animate-ping">{countdown > 0 ? countdown : 'Go!'}</span>
            </div>
        )}

        <div className="w-full max-w-5xl">
            {/* --- Main Timer Display --- */}
            <div className="text-center mb-8 h-20">
                {gameState === 'running' && (
                    <div className="text-6xl font-bold text-yellow-400">
                        {Math.ceil(remainingTime)}
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-center mb-4 px-2">
                <div>
                    <h2 className="text-xl font-bold text-white">{username} (You)</h2>
                    <p className="text-3xl font-bold text-yellow-400">{wpm} WPM</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-white">{initialOpponent.username}</h2>
                    <p className="text-gray-400">Rating: {initialOpponent.rating}</p>
                </div>
            </div>
            
            {/* --- Text container with conditional blur --- */}
            <div className={`text-3xl font-mono leading-relaxed tracking-wider select-none h-48 overflow-hidden transition-all duration-300 ${gameState === 'countdown' ? 'filter blur-md' : 'filter blur-none'}`}>
                <div className="flex flex-wrap">
                  {renderText()}
                </div>
            </div>

            {isFinished && !results && (
                <div className="mt-6 text-center text-yellow-400 font-semibold animate-pulse">
                    Waiting for opponent...
                </div>
            )}

            <div className="mt-6 px-2 space-y-3">
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${myProgress}%` }} />
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div className="bg-gray-500 h-2.5 rounded-full" style={{ width: `${opponentProgressBar}%` }} />
                </div>
            </div>
        </div>
      </div>
      </div>
      
      <ResultsModal isOpen={!!results} results={results!} />
    </>
  );
}
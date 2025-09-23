'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';
import ResultsModal from './ResultsModal';
import { useRouter } from 'next/navigation';
import { Howl } from 'howler';

const keySound = new Howl({ src: ['/sounds/key-press.ogg'] });
const errorSound = new Howl({ src: ['/sounds/error.ogg'], volume: 0.5 });

// --- YOUR BRILLIANT SUGGESTION: A type-safe interface for our results ---
export interface PlayerResult {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  finalScore: number;
  oldRating: number;
  newRating: number;
}
export interface MatchResult {
  winnerId: string | null;
  players: PlayerResult[];
}

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
  const [results, setResults] = useState<MatchResult | null>(null); // Use our new interface

  const startTime = useRef<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [isError, setIsError] = useState(false);

  const finishGame = useCallback((finalInput = userInput) => {
    if (isFinished || !socket) return;
    setIsFinished(true);
    if (!startTime.current || finalInput.length === 0) {
        socket.emit('playerFinished', { matchId, wpm: 0, accuracy: 0 });
        return;
    }
    const finalElapsedTime = (Date.now() - startTime.current) / 60000;
    const finalWpm = Math.round((finalInput.length / 5) / finalElapsedTime);
    const correctChars = textToType.split('').reduce((acc, char, i) => acc + (finalInput[i] === char ? 1 : 0), 0);
    const accuracy = Math.round((correctChars / finalInput.length) * 100) || 0;
    socket.emit('playerFinished', { matchId, wpm: finalWpm, accuracy });
  }, [isFinished, socket, matchId, textToType, userInput]);

  useEffect(() => {
    if (isLoggedIn) setIsStoreHydrated(true);
  }, [isLoggedIn]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'running' || isFinished) return;
    if (e.key.length === 1 && userInput.length === textToType.length - 1) {
        if (gameMode.mode === 'words') {
            setTimeout(() => finishGame(userInput + e.key), 50);
        }
    }
    if (userInput.length >= textToType.length) return;
    if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
    if (!startTime.current && e.key.length === 1) {
      startTime.current = Date.now();
      if (socket) socket.emit('playerStartedTyping', matchId);
    }
    if (e.key.length === 1) {
      const expectedChar = textToType[userInput.length];
      if (e.key === expectedChar) keySound.play(); else errorSound.play();
      setIsError(e.key !== expectedChar);
      if (e.key !== expectedChar) setTimeout(() => setIsError(false), 200);
      setUserInput((prev) => prev + e.key);
    } else if (e.key === 'Backspace') {
      setIsError(false);
      setUserInput((prev) => prev.slice(0, -1));
    }
  }, [userInput, textToType, gameState, isFinished, socket, matchId, finishGame, gameMode.mode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (socket && isStoreHydrated) {
      socket.emit('joinMatchRoom', matchId);
      const handlePreGameCountdown = (data: { countdown: number }) => { setGameState('countdown'); setCountdown(data.countdown); };
      const handleGameStart = () => setGameState('running');
      const handleMatchAborted = (data: { message: string }) => { alert(data.message); router.push('/'); };
      const handleOpponentProgress = (data: { playerId: string, progress: number }) => { if (userId && data.playerId !== userId) setOpponentProgress(data.progress); };
      const handleTimerUpdate = (data: { remainingTime: number }) => setRemainingTime(data.remainingTime);
      const handleGameOver = () => finishGame();
      const handleMatchResult = (data: MatchResult) => setResults(data);

      socket.on('preGameCountdown', handlePreGameCountdown);
      socket.on('gameStart', handleGameStart);
      socket.on('matchAborted', handleMatchAborted);
      socket.on('opponentProgress', handleOpponentProgress);
      socket.on('timerUpdate', handleTimerUpdate);
      socket.on('gameOver', handleGameOver);
      socket.on('matchResult', handleMatchResult);

      // This is the trigger for when the game ends in ANY mode
      // It asks the server to calculate and return the final results
      if(isFinished) {
        setTimeout(() => { if (socket) socket.emit('requestResults', matchId); }, 1000);
      }

      return () => {
        socket.off('preGameCountdown');
        socket.off('gameStart');
        socket.off('matchAborted');
        socket.off('opponentProgress');
        socket.off('timerUpdate');
        socket.off('gameOver');
        socket.off('matchResult');
      };
    }
  }, [socket, matchId, userId, isStoreHydrated, finishGame, router, isFinished]);

  useEffect(() => {
    if (socket && isStoreHydrated && !isFinished && startTime.current) {
      socket.emit('playerProgress', { matchId, progress: userInput.length });
      const elapsedTime = (Date.now() - startTime.current) / 60000;
      setWpm(elapsedTime > 0 ? Math.round((userInput.length / 5) / elapsedTime) : 0);
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
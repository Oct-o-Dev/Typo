// client/src/components/ResultsModal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Crown, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Define the shape of the result data
interface PlayerResult {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  finalScore: number;
  oldRating: number;
  newRating: number;
}

interface ResultsModalProps {
  isOpen: boolean;
  results: {
    winnerId: string | null;
    players: PlayerResult[];
  };
}

export default function ResultsModal({ isOpen, results }: ResultsModalProps) {
  const router = useRouter();
  const { userId } = useAuthStore();

  if (!isOpen) return null;

  const handlePlayAgain = () => {
    router.push('/');
  };

  const getRatingChange = (player: PlayerResult) => {
    const change = player.newRating - player.oldRating;
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return `±0`;
  };

  const myResult = results.players.find(p => p.id === userId);
  const isWinner = myResult?.id === results.winnerId;
  const isDraw = results.winnerId === null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 w-full max-w-2xl text-center shadow-2xl shadow-yellow-400/10">
        
        {isDraw ? (
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <ShieldAlert className="text-gray-400" size={36} /> Draw!
          </h1>
        ) : isWinner ? (
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 flex items-center justify-center gap-3">
            <Crown size={36} /> Victory!
          </h1>
        ) : (
          <h1 className="text-4xl font-bold text-red-500 mb-2">Defeat</h1>
        )}
        
        <p className="text-gray-400 mb-8">The match has concluded. Here are the results.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {results.players.map((player) => (
            <div key={player.id} className={`p-4 rounded-lg border ${player.id === results.winnerId ? 'bg-yellow-400/10 border-yellow-400/50' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{player.username} {player.id === userId && '(You)'}</h3>
                {player.id === results.winnerId && <Crown className="text-yellow-400" />}
              </div>
              <div className="mt-4 space-y-2 text-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">Score</span>
                  <span className="font-semibold text-white">{player.finalScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">WPM</span>
                  <span className="font-semibold text-white">{player.wpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy</span>
                  <span className="font-semibold text-white">{player.accuracy}%</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                  <span className="text-gray-400">Rating</span>
                  <span className="font-semibold text-white">
                    {player.newRating}
                    <span className={getRatingChange(player).startsWith('+') ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                      ({getRatingChange(player)})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button onClick={handlePlayAgain} size="lg">Play Again</Button>
        </div>
      </div>
    </div>
  );
}
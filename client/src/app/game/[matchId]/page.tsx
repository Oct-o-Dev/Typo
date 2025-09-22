// client/src/app/game/[matchId]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import GameClient from '@/components/GameClient';

// Define placeholder types for our state
interface Opponent {
  id: string;
  username: string;
  rating: number;
}

interface GameMode {
  mode: 'time' | 'words';
  duration: number;
}

interface MatchData {
  text: string;
  opponent: Opponent;
  gameMode: GameMode;
}

export default function GamePage() {
    const params = useParams();
    const { socket } = useSocket();
    const matchId = Array.isArray(params.matchId) ? params.matchId[0] : (params.matchId ?? '');
    
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (socket && matchId) {
            // --- NEW FIX: Proactively ask for the match data ---
            console.log(`Socket connected. Requesting data for match: ${matchId}`);
            socket.emit('getMatchData', { matchId });

            const handleMatchDataResponse = (data: { opponent: Opponent, text: string, gameMode: GameMode }) => { // Add gameMode
                setMatchData(data);
                setError(null);
            };

            // Also handle potential errors from the server
            const handleError = (data: { message: string }) => {
                setError(data.message);
            };
            
            // Listen for the response and errors
            socket.on('matchDataResponse', handleMatchDataResponse);
            socket.on('error', handleError);
            
            // Cleanup listeners on unmount
            return () => {
                socket.off('matchDataResponse', handleMatchDataResponse);
                socket.off('error', handleError);
            };

        } else {
            setError('Connecting to the game server...');
        }
    }, [socket, matchId]); // Rerun this effect if the socket connects
    
    if (!matchData) {
        return (
            <div className="text-center mt-20">
                <h1 className="text-3xl font-bold text-yellow-400 animate-pulse">
                    {error || 'Loading Match...'}
                </h1>
            </div>
        );
    }

    return (
        <GameClient 
            matchId={matchId} 
            initialText={matchData.text} 
            initialOpponent={matchData.opponent}
            gameMode={matchData.gameMode} // Pass the game mode down
        />
    );
}
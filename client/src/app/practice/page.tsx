'use client';

import { useState, useEffect } from 'react';
import GameClient from '@/components/GameClient';
import GameSettings, { GameMode, GameSetting } from '@/components/GameSettings';
import { commonWords } from '@/config/wordlist';
import { Skeleton } from '@/components/ui/skeleton'; // We'll create this simple component

const generateClientSideWords = (count = 100) => {
    let words = [];
    for (let i = 0; i < count; i++) {
        words.push(commonWords[Math.floor(Math.random() * commonWords.length)]);
    }
    return words.join(' ');
}

const botOpponent = {
    id: 'bot-1',
    username: 'TypoBot',
    rating: 1200
};

export default function PracticePage() {
    const [gameMode, setGameMode] = useState<GameMode>('time');
    const [gameSetting, setGameSetting] = useState<GameSetting<'time'> | GameSetting<'words'>>(30);
    
    // --- THE FIX: State for the generated text ---
    const [textToType, setTextToType] = useState<string | null>(null);
    const [gameKey, setGameKey] = useState(1);

    // --- THE FIX: Generate words on the client after mount ---
    useEffect(() => {
        const newText = gameMode === 'time' ? generateClientSideWords(100) : generateClientSideWords(gameSetting);
        setTextToType(newText);
    }, [gameKey, gameMode, gameSetting]);

    const handleSettingsChange = (mode: GameMode, setting: GameSetting<'time'> | GameSetting<'words'>) => {
        setGameMode(mode);
        setGameSetting(setting);
        setGameKey(prev => prev + 1); // This triggers a new game
    };

    return (
        <div>
            <div className="flex justify-center mb-8">
                <GameSettings 
                    gameMode={gameMode}
                    setGameMode={(mode) => handleSettingsChange(mode, mode === 'time' ? 30 : 25)}
                    gameSetting={gameSetting}
                    setGameSetting={(setting) => handleSettingsChange(gameMode, setting)}
                />
            </div>

            {/* --- THE FIX: Show a loading skeleton while generating words --- */}
            {textToType ? (
                <GameClient
                    key={gameKey}
                    matchId="practice-match"
                    initialText={textToType}
                    initialOpponent={botOpponent}
                    gameMode={{ mode: gameMode, duration: gameSetting }}
                    isSoloMode={true}
                />
            ) : (
                <div className="w-full max-w-5xl mx-auto">
                    <Skeleton className="h-48 w-full" />
                </div>
            )}
        </div>
    );
}
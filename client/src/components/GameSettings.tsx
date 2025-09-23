// client/src/components/GameSettings.tsx
'use client';

import { cn } from "@/lib/utils";
import { Clock, Type } from "lucide-react";

export type GameMode = 'time' | 'words';
export type GameSetting<T extends GameMode> = T extends 'time' ? 15 | 30 | 60 : 10 | 25 | 50;

interface GameSettingsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  gameSetting: GameSetting<'time'> | GameSetting<'words'>;
  setGameSetting: (setting: GameSetting<'time'> | GameSetting<'words'>) => void;
}

const timeOptions: GameSetting<'time'>[] = [15, 30, 60];
const wordOptions: GameSetting<'words'>[] = [10, 25, 50];

export default function GameSettings({ gameMode, setGameMode, gameSetting, setGameSetting }: GameSettingsProps) {
  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'time') {
      setGameSetting(30);
    } else {
      setGameSetting(25);
    }
  };

  const options = gameMode === 'time' ? timeOptions : wordOptions;

  return (
    <div className="bg-gray-900/50 p-2 rounded-lg flex items-center justify-center space-x-2 md:space-x-4">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleModeChange('time')}
          className={cn("flex items-center space-x-2 p-2 rounded-md transition-colors", gameMode === 'time' ? "text-yellow-400" : "text-gray-400 hover:text-white")}
        >
          <Clock size={18} />
          <span>time</span>
        </button>
        <button
          onClick={() => handleModeChange('words')}
          className={cn("flex items-center space-x-2 p-2 rounded-md transition-colors", gameMode === 'words' ? "text-yellow-400" : "text-gray-400 hover:text-white")}
        >
          <Type size={18} />
          <span>words</span>
        </button>
      </div>
      <div className="h-6 w-px bg-gray-700"></div>
      <div className="flex items-center space-x-2">
        {options.map((option) => (
          <button
            key={option}
            // FIX: Removed the 'as any' cast
            onClick={() => setGameSetting(option)}
            className={cn(
              "p-2 w-10 text-center rounded-md transition-colors",
              gameSetting === option ? "bg-yellow-400 text-black font-bold" : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
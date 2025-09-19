'use client';
import { ArrowRight, BarChart, Bot, Swords, Users } from "lucide-react";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/Button';

const features = [
  {
    icon: <Swords className="h-10 w-10 text-yellow-400" />,
    title: "Live 1v1 Matches",
    description: "Experience the thrill of real-time racing against a live opponent. See their 'ghost' race alongside you as you type.",
  },
  {
    icon: <Users className="h-10 w-10 text-yellow-400" />,
    title: "Skill-Based Matchmaking",
    description: "Our ELO rating system ensures you're always paired against opponents of a similar skill level for a fair and challenging match.",
  },
  {
    icon: <Bot className="h-10 w-10 text-yellow-400" />,
    title: "Practice Against Bots",
    description: "Hone your skills against a variety of AI opponents. Choose a difficulty level that matches your WPM to prepare for live competition.",
  },
  {
    icon: <BarChart className="h-10 w-10 text-yellow-400" />,
    title: "Detailed Analytics",
    description: "Track your progress over time. Monitor your WPM, accuracy, consistency, and match history to identify your strengths.",
  },
];

export default function HomePage() {
  const { isLoggedIn } = useAuthStore();
  const { socket } = useSocket();
  const [matchmakingStatus, setMatchmakingStatus] = useState<'idle' | 'searching'>('idle');
  const router = useRouter();

  // --- NEW: Handle Find Match ---

  const handleFindMatch = () => {
    if (socket) {
      setMatchmakingStatus('searching');
      // cast to any so TS won't complain about missing typings here
      const s = socket as any;
      s.emit('findMatch');

      s.once('matchFound', (data: any) => {
        console.log('Match Found!', data);
        alert(`Match Found! Opponent: ${data.opponent?.username ?? 'unknown'} (Rating: ${data.opponent?.rating ?? 'n/a'})`);
        setMatchmakingStatus('idle');
      });
    } else {
      alert('You must be logged in to find a match!');
    }
  };

  useEffect(() => {
    if (socket) {
        socket.on('matchFound', (data) => {
            console.log('Match Found! Navigating to game...', data);
            // Navigate to the dynamic game page with the match ID
            router.push(`/game/${data.matchId}`);
        });

        // Clean up the event listener when the component unmounts
        return () => {
            socket.off('matchFound');
        };
    }
  }, [socket, router]);

  return (
    <>
      <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-10rem)]">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white">
          Welcome to <span className="text-yellow-400">Typo</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl text-gray-400">
          The ultimate typing arena where speed and accuracy make you a champion.
          Challenge friends, climb the ranks, and become a keyboard legend.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
        {isLoggedIn ? (
          <Button onClick={handleFindMatch} size="lg" disabled={matchmakingStatus === 'searching'}>
            {matchmakingStatus === 'searching' ? 'Searching...' : 'Find a Match'}
            <ArrowRight size={20} className="ml-2" />
          </Button>
        ) : (
            <p className="text-yellow-400">Please Sign In or Sign Up to play!</p>
          )}
        </div>

        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
              Features Built for <span className="text-yellow-400">Competition</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-slate-900/50 p-6 rounded-lg border border-slate-700/50 flex flex-col items-center text-center transition-transform hover:-translate-y-2"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
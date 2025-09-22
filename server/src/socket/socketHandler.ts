// server/src/socket/socketHandler.ts
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import Match from '../models/Match';
import { generateRandomWords } from '../config/wordlist';
import { calculateNewRatings } from '../services/eloService';

interface FindMatchPayload { gameMode: 'time' | 'words'; gameSetting: number; }

const matchmakingQueues = new Map<string, Socket[]>();
const activeTimers = new Map<string, NodeJS.Timeout>();
const matchResults = new Map<string, { [playerId: string]: { wpm: number; accuracy: number; finalScore: number } }>();
const matchState = new Map<string, { started: boolean; readyPlayers: Set<string>; finishedPlayers: Set<string> }>();

// This helper function centralizes our results logic to avoid duplicating code.
const calculateAndEmitResults = async (io: Server, matchId: string) => {
    const results = matchResults.get(matchId);
    const match = await Match.findOne({ matchId }).populate('players');
    if (!results || !match || match.players.length < 2) return;

    const [player1Doc, player2Doc] = match.players as any[];
    const player1Result = results[player1Doc._id.toString()] || { wpm: 0, accuracy: 0, finalScore: 0 };
    const player2Result = results[player2Doc._id.toString()] || { wpm: 0, accuracy: 0, finalScore: 0 };

    let resultForElo: 1 | 0.5 | 0 = 0.5;
    if (player1Result.finalScore > player2Result.finalScore) resultForElo = 1;
    else if (player2Result.finalScore > player1Result.finalScore) resultForElo = 0;

    const { newRatingA, newRatingB } = calculateNewRatings(player1Doc.rating, player2Doc.rating, resultForElo);
    await User.findByIdAndUpdate(player1Doc._id, { rating: newRatingA });
    await User.findByIdAndUpdate(player2Doc._id, { rating: newRatingB });
    
    const finalResult = {
        winnerId: resultForElo === 0.5 ? null : (resultForElo === 1 ? player1Doc._id.toString() : player2Doc._id.toString()),
        players: [
            { id: player1Doc._id.toString(), username: player1Doc.username, ...player1Result, oldRating: player1Doc.rating, newRating: newRatingA },
            { id: player2Doc._id.toString(), username: player2Doc.username, ...player2Result, oldRating: player2Doc.rating, newRating: newRatingB }
        ]
    };
    
    io.to(matchId).emit('matchResult', finalResult);
    // Clean up all memory for this match
    matchResults.delete(matchId);
    matchState.delete(matchId);
    activeTimers.delete(matchId);
    activeTimers.delete(`abort_${matchId}`);
};

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, { cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] } });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Auth error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('username rating');
      if (!user) return next(new Error('User not found'));
      const u = user as any;
      socket.user = { id: u._id.toString(), username: u.username, rating: u.rating };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (!socket.user) return socket.disconnect();

    

    console.log(`✅ User connected: ${socket.user.username}`);

    socket.on('playerFinished', async (data: { matchId: string, wpm: number, accuracy: number }) => {
        if (!socket.user) return;
        const state = matchState.get(data.matchId);
        if (!state) return;

        const finalScore = Math.round(data.wpm * (data.accuracy / 100));
        const currentResults = matchResults.get(data.matchId) || {};
        currentResults[socket.user.id] = { wpm: data.wpm, accuracy: data.accuracy, finalScore };
        matchResults.set(data.matchId, currentResults);
        
        state.finishedPlayers.add(socket.user.id);

        const match = await Match.findOne({ matchId: data.matchId });
        if (match?.gameMode.mode === 'words') {
            // If both players have finished, end the game immediately
            if (state.finishedPlayers.size === 2) {
                const graceTimer = activeTimers.get(data.matchId);
                if (graceTimer) clearTimeout(graceTimer);
                calculateAndEmitResults(io, data.matchId);
            } 
            // If this is the FIRST player to finish, start the grace period timer
            else if (state.finishedPlayers.size === 1) {
                console.log(`First player finished in words match ${data.matchId}. Starting 20s grace period.`);
                const graceTimer = setTimeout(() => {
                    console.log(`Grace period ended for match ${data.matchId}. Calculating results.`);
                    calculateAndEmitResults(io, data.matchId);
                }, 20000); // 20-second grace period
                activeTimers.set(data.matchId, graceTimer);
            }
        }
    });

    // --- 'gameOver' now only triggers from the server timer in 'time' mode ---
    const handleGameOver = (matchId: string) => {
        // After a delay, calculate results for time mode games
        setTimeout(() => {
            calculateAndEmitResults(io, matchId);
        }, 1000);
    };

    socket.on('findMatch', async (payload: FindMatchPayload) => {
      if (!socket.user) return;

      
      const queueKey = `${payload.gameMode}-${payload.gameSetting}`;
      if (!matchmakingQueues.has(queueKey)) {
        matchmakingQueues.set(queueKey, []);
      }
      const queue = matchmakingQueues.get(queueKey)!;

      if (queue.some(s => s.user?.id === socket.user?.id)) return;
      
      console.log(`${socket.user.username} joined queue: ${queueKey}`);
      queue.push(socket);

      if (queue.length >= 2) {
        const player1 = queue.shift()!;
        const player2 = queue.shift()!;
        const matchId = uuidv4();

        if (!player1.user || !player2.user) {
            if (player1) queue.unshift(player1);
            if (player2) queue.unshift(player2);
            return;
        }
        
        const textToType = payload.gameMode === 'time' ? generateRandomWords(100) : generateRandomWords(payload.gameSetting);
        const gameMode = { mode: payload.gameMode, duration: payload.gameSetting };

        await Match.create({ matchId, text: textToType, players: [player1.user.id, player2.user.id], gameMode });
        
        const matchData = { matchId, opponent: player2.user, text: textToType, gameMode };
        player1.emit('matchFound', matchData);
        player2.emit('matchFound', { ...matchData, opponent: player1.user });
        
        player1.join(matchId);
        player2.join(matchId);
        matchResults.set(matchId, {});
        matchState.set(matchId, { started: false, readyPlayers: new Set(), finishedPlayers: new Set() });

        let countdown = 5;
        const preGameTimer = setInterval(() => {
            io.to(matchId).emit('preGameCountdown', { countdown });
            countdown--;
            if (countdown < 0) {
                clearInterval(preGameTimer);
                io.to(matchId).emit('gameStart');
                const abortTimer = setTimeout(() => {
                    const state = matchState.get(matchId);
                    if (state && !state.started) {
                        io.to(matchId).emit('matchAborted', { message: 'Match aborted.' });
                        matchState.delete(matchId);
                    }
                }, 10000);
                activeTimers.set(`abort_${matchId}`, abortTimer);
            }
        }, 1000);
      }
    });
    
    socket.on('playerStartedTyping', (matchId: string) => {
      const state = matchState.get(matchId);
      if (state && !state.started) {
        state.started = true;
        
        const abortTimer = activeTimers.get(`abort_${matchId}`);
        if (abortTimer) clearTimeout(abortTimer);
        
        Match.findOne({ matchId }).then(match => {
          if (match?.gameMode.mode === 'time') {
            const gameDuration = match.gameMode.duration;
            const startTime = Date.now();
            const timer = setInterval(() => {
              const remainingTime = Math.max(0, gameDuration - ((Date.now() - startTime) / 1000));
              io.to(matchId).emit('timerUpdate', { remainingTime });
              if (remainingTime <= 0) {
                clearInterval(timer);
                activeTimers.delete(matchId);
                io.to(matchId).emit('gameOver');
              }
            }, 1000);
            activeTimers.set(matchId, timer);
          }
        });
      }
    });

    socket.on('playerFinished', (data: { matchId: string, wpm: number, accuracy: number }) => {
        if (!socket.user) return;
        const finalScore = Math.round(data.wpm * (data.accuracy / 100));
        const currentResults = matchResults.get(data.matchId) || {};
        currentResults[socket.user.id] = { wpm: data.wpm, accuracy: data.accuracy, finalScore };
        matchResults.set(data.matchId, currentResults);
    });

    socket.on('requestResults', async (matchId: string) => {
        if (!socket.user) return;
        const results = matchResults.get(matchId);
        const match = await Match.findOne({ matchId }).populate('players');
        if (!results || !match || match.players.length < 2) return;

        const [player1Doc, player2Doc] = match.players as any[];
        const player1Result = results[player1Doc._id.toString()] || { wpm: 0, accuracy: 0, finalScore: 0 };
        const player2Result = results[player2Doc._id.toString()] || { wpm: 0, accuracy: 0, finalScore: 0 };

        let resultForElo: 1 | 0.5 | 0 = 0.5;
        if (player1Result.finalScore > player2Result.finalScore) resultForElo = 1;
        else if (player2Result.finalScore > player1Result.finalScore) resultForElo = 0;

        const { newRatingA, newRatingB } = calculateNewRatings(player1Doc.rating, player2Doc.rating, resultForElo);
        await User.findByIdAndUpdate(player1Doc._id, { rating: newRatingA });
        await User.findByIdAndUpdate(player2Doc._id, { rating: newRatingB });
        
        const finalResult = {
            winnerId: resultForElo === 0.5 ? null : (resultForElo === 1 ? player1Doc._id.toString() : player2Doc._id.toString()),
            players: [
                { id: player1Doc._id.toString(), username: player1Doc.username, ...player1Result, oldRating: player1Doc.rating, newRating: newRatingA },
                { id: player2Doc._id.toString(), username: player2Doc.username, ...player2Result, oldRating: player2Doc.rating, newRating: newRatingB }
            ]
        };
        
        io.to(matchId).emit('matchResult', finalResult);
        matchResults.delete(matchId);
        matchState.delete(matchId);
    });

    socket.on('joinMatchRoom', (matchId: string) => {
        socket.join(matchId);
        console.log(`🙋‍♂️ User '${socket.user?.username}' joined room: ${matchId}`);
    });

    socket.on('getMatchData', async (data: { matchId: string }) => {
      if (!socket.user) return;
      try {
        const match = await Match.findOne({ matchId: data.matchId }).populate('players');
        if (!match) return socket.emit('matchError', { message: 'Match not found.' });
        const opponentDoc = match.players.find(p => (p as any)._id.toString() !== socket.user!.id);
        if (!opponentDoc) return socket.emit('matchError', { message: 'Opponent not found.' });
        const opponent = opponentDoc as any;
        socket.emit('matchDataResponse', {
            text: match.text,
            opponent: { id: opponent._id.toString(), username: opponent.username, rating: opponent.rating },
            gameMode: match.gameMode
        });
      } catch (error) {
        socket.emit('matchError', { message: 'Failed to retrieve match data.' });
      }
    });

    socket.on('playerProgress', (data: { matchId: string; progress: number }) => {
        socket.to(data.matchId).emit('opponentProgress', {
            playerId: socket.user?.id,
            progress: data.progress,
        });
    });

    socket.on('disconnect', () => {
      if (!socket.user) return;
      console.log(`❌ User disconnected: ${socket.user.username} (${socket.id})`);

      for (const [queueKey, queue] of matchmakingQueues.entries()) {
        const index = queue.findIndex(s => s.id === socket.id);
        if (index !== -1) {
          queue.splice(index, 1);
          console.log(`${socket.user.username} removed from queue: ${queueKey}`);
          break;
        }
      }
    });
  });
};
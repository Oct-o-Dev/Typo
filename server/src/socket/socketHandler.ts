import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import Match, { getRandomParagraph } from '../models/Match';

const matchmakingQueue: (import("socket.io").Socket)[] = [];

export const initSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token not provided.'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('username rating');
      if (!user) return next(new Error('Authentication error: User not found.'));
      const u = user as any;
      socket.user = { id: u._id?.toString() ?? u.id ?? decoded.id, username: u.username, rating: u.rating };
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    if (!socket.user) {
      return socket.disconnect();
    }
    
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    socket.on('joinMatchRoom', (matchId: string) => {
        socket.join(matchId);
        console.log(`🙋‍♂️ User '${socket.user?.username}' joined room: ${matchId}`);
    });

    socket.on('findMatch', async () => {
      if (!socket.user) return;
      if (matchmakingQueue.some(s => s.user?.id === socket.user?.id)) return;
      matchmakingQueue.push(socket);
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift()!;
        const player2 = matchmakingQueue.shift()!;
        const matchId = uuidv4();
        if (!player1.user || !player2.user) {
            if (player1) matchmakingQueue.unshift(player1);
            if (player2) matchmakingQueue.unshift(player2);
            return;
        }
        const textToType = getRandomParagraph();
        await Match.create({ matchId, text: textToType, players: [player1.user.id, player2.user.id] });
        console.log(`Match found! ${player1.user.username} vs ${player2.user.username}. Match ID: ${matchId}`);
        player1.emit('matchFound', { matchId, opponent: player2.user, text: textToType });
        player2.emit('matchFound', { matchId, opponent: player1.user, text: textToType });
        player1.join(matchId);
        player2.join(matchId);
      }
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
            opponent: { id: opponent._id.toString(), username: opponent.username, rating: opponent.rating }
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
      const index = matchmakingQueue.findIndex(s => s.id === socket.id);
      if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        console.log(`${socket.user.username} removed from queue.`);
      }
    });
  });
};
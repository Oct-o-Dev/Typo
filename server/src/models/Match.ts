// server/src/models/Match.ts
import mongoose, { Schema, Document } from 'mongoose';

// We no longer need the paragraphs array here.

export interface IMatch extends Document {
  matchId: string;
  text: string;
  startTime: Date;
  players: mongoose.Types.ObjectId[];
  gameMode: {
    mode: 'time' | 'words';
    duration: number; // e.g., 30 for 30 seconds
  };
}

const MatchSchema: Schema = new Schema({
  matchId: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  startTime: { type: Date },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // NEW: Store the game mode for each match
  gameMode: {
    mode: { type: String, enum: ['time', 'words'], default: 'time' },
    duration: { type: Number, default: 30 }
  }
}, { timestamps: true });

// We are moving the random text generation to the socket handler.

export default mongoose.model<IMatch>('Match', MatchSchema);
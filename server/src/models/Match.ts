// server/src/models/Match.ts
import mongoose, { Schema, Document } from 'mongoose';

// A simple collection of paragraphs for our game
const paragraphs = [
    "The quick brown fox jumps over the lazy dog. This sentence is a classic pangram, containing all the letters of the English alphabet. It's often used for practicing typing and testing fonts.",
    "Technology has revolutionized the way we live and work. From the invention of the wheel to the rise of the internet, human innovation continues to push the boundaries of what is possible.",
    "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune, Or to take arms against a sea of troubles, And by opposing end them.",
    "The journey of a thousand miles begins with a single step. This ancient proverb reminds us that even the most daunting tasks are achievable if we break them down into smaller, manageable actions.",
    "In the heart of the bustling city, there was a quiet park. It was a small oasis of green, a place where people could escape the noise and chaos of their daily lives."
];

export interface IMatch extends Document {
  matchId: string;
  text: string;
  startTime?: Date;
  players: mongoose.Types.ObjectId[];
}

const MatchSchema: Schema = new Schema({
  matchId: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  startTime: { type: Date },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });


// Helper function to get a random paragraph
export const getRandomParagraph = () => {
    return paragraphs[Math.floor(Math.random() * paragraphs.length)];
}

export default mongoose.model<IMatch>('Match', MatchSchema);
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email?: string;
  password?: string;
  username: string;
  isGuest: boolean;
  isVerified: boolean;
  rating: number;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, minlength: 6 },
  username: { type: String, required: true, unique: true },
  isGuest: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 1200 },
}, { timestamps: true });


UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- THIS IS WHERE WE'LL CATCH THE BUG ---
UserSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;

  // --- DEBUGGING LINES START ---
  console.log('\n--- Inside comparePassword Method ---');
  console.log('Comparing Plaintext:', `'${enteredPassword}'`); // Log with quotes to see whitespace
  console.log('Against Hashed:', `'${this.password}'`);      // Log with quotes
  // --- DEBUGGING LINES END ---

  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
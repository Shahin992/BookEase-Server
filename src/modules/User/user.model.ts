import mongoose, { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

// Define the interface for TypeScript
export interface IUser {
  fullName: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  role:'user' | 'admin' | 'moderator';
  userId: Number;
}

// Create the schema
const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'moderator'], 
      default: 'user' 
    },
    userId: { type: Number, unique: true }
  },
  { timestamps: true, versionKey: false }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.plugin(AutoIncrement, { inc_field: 'userId', start_seq: 1001 });

// Export the model
export const User = model<IUser>('book_Ease_User', userSchema);

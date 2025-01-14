import mongoose from "mongoose";
import { generateHash } from '@/lib/utils';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isPro: {
    type: Boolean,
    default: false,
  },
  avatarHash: {
    type: String,
    default: () => generateHash(8),
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
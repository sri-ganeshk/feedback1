import mongoose from 'mongoose';

const RollNumberSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const RollNumber =
  mongoose.models.RollNumber || mongoose.model('RollNumber', RollNumberSchema);

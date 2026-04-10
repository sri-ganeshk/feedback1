import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    rk_key: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback =
  mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

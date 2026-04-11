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

FeedbackSchema.index({ rollNumber: 1, createdAt: -1 });

export const Feedback =
  mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);

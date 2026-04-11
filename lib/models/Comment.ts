import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Feedback',
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Comment',
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

CommentSchema.index({ feedbackId: 1, createdAt: 1 });

export const Comment =
  mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

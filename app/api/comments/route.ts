import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { Comment } from '@/lib/models/Comment';
import { Feedback } from '@/lib/models/Feedback';
import { RollNumber } from '@/lib/models/RollNumber';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { feedbackId, parentCommentId, text } = await request.json();

    if (!feedbackId || !text || !text.trim()) {
      return NextResponse.json(
        { error: 'Feedback ID and text are required' },
        { status: 400 }
      );
    }

    // Read rk_key from cookies
    const cookieStore = await cookies();
    const rk_key = cookieStore.get('rk_key')?.value ?? null;

    // Create comment
    const comment = await Comment.create({
      feedbackId,
      parentCommentId: parentCommentId || null,
      text: text.trim(),
      rk_key,
  });

    // Increment replyCount on the parent RollNumber
    const feedback = await Feedback.findById(feedbackId).lean();
    if (feedback) {
      await RollNumber.findOneAndUpdate(
        { rollNumber: feedback.rollNumber },
        { $inc: { replyCount: 1 } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        comment: {
          _id: comment._id,
          feedbackId: comment.feedbackId,
          parentCommentId: comment.parentCommentId,
          text: comment.text,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Comment } from '@/lib/models/Comment';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    await connectDB();

    const { feedbackId } = await params;

    const comments = await Comment.find({ feedbackId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(comments, { status: 200 });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

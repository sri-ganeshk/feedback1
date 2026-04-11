import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Comment } from '@/lib/models/Comment';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const feedbackIds = request.nextUrl.searchParams.get('feedbackIds');
    if (!feedbackIds) {
      return NextResponse.json({}, { status: 200 });
    }

    const ids = feedbackIds.split(',').filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const comments = await Comment.find({ feedbackId: { $in: ids } })
      .sort({ createdAt: 1 })
      .lean();

    const grouped: Record<string, typeof comments> = {};
    for (const id of ids) {
      grouped[id] = [];
    }
    for (const comment of comments) {
      const key = comment.feedbackId.toString();
      grouped[key]?.push(comment);
    }

    return NextResponse.json(grouped, { status: 200 });
  } catch (error) {
    console.error('Error fetching bulk comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

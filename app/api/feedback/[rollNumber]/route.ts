import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Feedback } from '@/lib/models/Feedback';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rollNumber: string }> }
) {
  try {
    await connectDB();

    const { rollNumber } = await params;

    const feedbacks = await Feedback.find({ rollNumber })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(feedbacks, { status: 200 });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongodb';
import { RollNumber } from '@/lib/models/RollNumber';
import { Feedback } from '@/lib/models/Feedback';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { rollNumber, text } = await request.json();

    if (!rollNumber || !text || !rollNumber.trim() || !text.trim()) {
      return NextResponse.json(
        { error: 'Roll number and text are required' },
        { status: 400 }
      );
    }

    // Read rk_key from cookies
    const cookieStore = await cookies();
    const rk_key = cookieStore.get('rk_key')?.value ?? null;

    // Ensure roll number exists
    let rollNumberDoc = await RollNumber.findOne({ rollNumber });
    if (!rollNumberDoc) {
      rollNumberDoc = await RollNumber.create({
        rollNumber,
        feedbackCount: 0,
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      rollNumber,
      text: text.trim(),
      rk_key,
    });

    // Increment feedback count
    await RollNumber.findByIdAndUpdate(
      rollNumberDoc._id,
      { $inc: { feedbackCount: 1 } }
    );

    return NextResponse.json(
      {
        success: true,
        feedback: {
          _id: feedback._id,
          rollNumber: feedback.rollNumber,
          text: feedback.text,
          createdAt: feedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}

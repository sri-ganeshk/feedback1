import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { PipelineStage } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { RollNumber } from '@/lib/models/RollNumber';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search')?.trim() || '';

    const matchQuery: Record<string, unknown> = {};

    if (search) {
      const pattern = search
        .split('')
        .map((char) => {
          if (char === '*') return '.*';
          if (/[.+?^${}()|[\]\\]/.test(char)) return '\\' + char;
          return char;
        })
        .join('');
      matchQuery.rollNumber = { $regex: pattern, $options: 'i' };
    }

    // Decode cursor: base64(JSON { total, _id })
    let cursorTotal: number | null = null;
    let cursorId: ObjectId | null = null;
    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
        cursorTotal = decoded.total;
        cursorId = new ObjectId(decoded._id);
      } catch (e) {
        console.error('Invalid cursor:', e);
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: matchQuery },
      { $addFields: { totalCount: { $add: ['$feedbackCount', { $ifNull: ['$replyCount', 0] }] } } },
      ...(cursorTotal !== null && cursorId !== null
        ? [{
            $match: {
              $or: [
                { totalCount: { $lt: cursorTotal } },
                { totalCount: cursorTotal, _id: { $gt: cursorId } },
              ],
            },
          }]
        : []),
      { $sort: { totalCount: -1, _id: 1 } },
      { $limit: limit + 1 },
    ];

    const rollNumbers = await RollNumber.aggregate(pipeline);

    const hasMore = rollNumbers.length > limit;
    const data = hasMore ? rollNumbers.slice(0, limit) : rollNumbers;

    const lastItem = data[data.length - 1];
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ total: lastItem.totalCount, _id: lastItem._id.toString() })).toString('base64')
      : null;

    return NextResponse.json(
      {
        data: data.map((item) => ({
          _id: item._id,
          rollNumber: item.rollNumber,
          feedbackCount: item.feedbackCount,
          replyCount: item.replyCount ?? 0,
          totalCount: item.totalCount,
        })),
        nextCursor,
        hasMore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching roll numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roll numbers' },
      { status: 500 }
    );
  }
}

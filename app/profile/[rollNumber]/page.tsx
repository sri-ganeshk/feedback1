'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import FeedbackCard from '@/components/FeedbackCard';
import CommentThread from '@/components/CommentThread';

interface Feedback {
  _id: string;
  rollNumber: string;
  text: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  feedbackId: string;
  parentCommentId: string | null;
  text: string;
  createdAt: string;
}

interface ReplyTarget {
  feedbackId: string;
  parentCommentId: string | null;
  label: string;
}

function getReplyTargetLabel(target: ReplyTarget | null) {
  if (!target) {
    return '';
  }

  return target.parentCommentId ? 'a response' : 'this';
}

export default function ProfilePage() {
  const params = useParams();
  const rollNumber = decodeURIComponent(params.rollNumber as string);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [visibleThreads, setVisibleThreads] = useState<Record<string, boolean>>({});

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await fetch(`/api/feedback/${encodeURIComponent(rollNumber)}`);
      const data = await response.json();
      setFeedbacks(data);

      // Fetch comments for each feedback
      const commentsMap: { [key: string]: Comment[] } = {};
      for (const feedback of data) {
        const commentsResponse = await fetch(`/api/comments/${feedback._id}`);
        const commentsData = await commentsResponse.json();
        commentsMap[feedback._id] = commentsData;
      }
      setComments(commentsMap);

      setVisibleThreads((current) => {
        const next = { ...current };

        for (const feedback of data) {
          if (next[feedback._id] === undefined) {
            next[feedback._id] = false;
          }
        }

        return next;
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [rollNumber]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const toggleFeedbackThread = (feedbackId: string) => {
    setVisibleThreads((current) => ({
      ...current,
      [feedbackId]: !current[feedbackId],
    }));
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSubmittingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber, text: feedbackText }),
      });

      if (response.ok) {
        await response.json();
        setFeedbackText('');
        // Refetch all data
        await fetchFeedback();
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTarget) return;

    setSubmittingReply(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId: replyTarget.feedbackId,
          parentCommentId: replyTarget.parentCommentId,
          text: replyText,
        }),
      });

      if (response.ok) {
        setReplyText('');
        const activeFeedbackId = replyTarget.feedbackId;
        setReplyTarget(null);
        // Refetch comments for this feedback
        const commentsResponse = await fetch(`/api/comments/${activeFeedbackId}`);
        const commentsData = await commentsResponse.json();
        setComments((prev) => ({ ...prev, [activeFeedbackId]: commentsData }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Words for {rollNumber}
          </h1>

          {/* Add Feedback Form */}
          <form onSubmit={handleAddFeedback} className="space-y-3">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Whisper something anonymously..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              type="submit"
              disabled={submittingFeedback || !feedbackText.trim()}
              className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {submittingFeedback ? 'Whispering...' : 'Whisper'}
            </button>
          </form>
        </div>

        {/* Feedback List */}
        <div className="space-y-6">
          {feedbacks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">
                No one has written anything yet.
              </p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <div key={feedback._id}>
                <FeedbackCard
                  feedback={feedback}
                  repliesCount={comments[feedback._id]?.length ?? 0}
                  areRepliesVisible={visibleThreads[feedback._id] === true}
                  onReplyClick={() =>
                    setReplyTarget({
                      feedbackId: feedback._id,
                      parentCommentId: null,
                      label: 'feedback',
                    })
                  }
                  onToggleReplies={toggleFeedbackThread}
                  isReplying={replyTarget?.feedbackId === feedback._id && replyTarget.parentCommentId === null}
                />

                {/* Comments Thread */}
                {replyTarget?.feedbackId === feedback._id && (
                  <form onSubmit={handleReply} className="mt-4 ml-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-white">
                        Replying
                      </span>
                      <span>to {getReplyTargetLabel(replyTarget)}</span>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {submittingReply ? 'Posting...' : 'Respond'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTarget(null);
                          setReplyText('');
                        }}
                        className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {visibleThreads[feedback._id] === true && comments[feedback._id] && comments[feedback._id].length > 0 && (
                  <div className="mt-4 ml-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <CommentThread
                      comments={comments[feedback._id]}
                      feedbackId={feedback._id}
                      onReplyClick={(commentId, threadFeedbackId) => {
                        setReplyTarget({
                          feedbackId: threadFeedbackId,
                          parentCommentId: commentId,
                          label: 'a comment',
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

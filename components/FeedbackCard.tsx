'use client';

interface FeedbackCardProps {
  feedback: {
    _id: string;
    rollNumber: string;
    text: string;
    createdAt: string;
  };
  repliesCount?: number;
  areRepliesVisible?: boolean;
  onReplyClick: (feedbackId: string) => void;
  onToggleReplies?: (feedbackId: string) => void;
  isReplying?: boolean;
}

export default function FeedbackCard({
  feedback,
  repliesCount = 0,
  areRepliesVisible = false,
  onReplyClick,
  onToggleReplies,
  isReplying,
}: FeedbackCardProps) {
  const formattedDate = new Date(feedback.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">Anonymous</span>
          <span>{formattedDate}</span>
        </div>
      </div>
      <p className="whitespace-pre-wrap break-words text-base leading-7 text-gray-900">{feedback.text}</p>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {repliesCount > 0 && onToggleReplies && (
          <button
            onClick={() => onToggleReplies(feedback._id)}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            {areRepliesVisible
              ? `Hide responses (${repliesCount})`
              : `Show responses (${repliesCount})`}
          </button>
        )}
        <button
          onClick={() => onReplyClick(feedback._id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isReplying
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isReplying ? 'Cancel' : 'Respond'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';

interface Comment {
  _id: string;
  feedbackId: string;
  parentCommentId: string | null;
  text: string;
  createdAt: string;
}

interface CommentThreadProps {
  comments: Comment[];
  feedbackId: string;
  onReplyClick: (commentId: string, feedbackId: string) => void;
}

const ROOT_KEY = '__root__';

function formatCommentTime(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

export default function CommentThread({
  comments,
  feedbackId,
  onReplyClick,
}: CommentThreadProps) {
  const [collapsedComments, setCollapsedComments] = useState<Record<string, boolean>>({});

  const directChildrenMap = useMemo(() => {
    const map: Record<string, Comment[]> = {};

    for (const comment of comments) {
      const parentId = comment.parentCommentId ?? ROOT_KEY;
      if (!map[parentId]) {
        map[parentId] = [];
      }
      map[parentId].push(comment);
    }

    return map;
  }, [comments]);

  const getChildren = (commentId: string) => directChildrenMap[commentId] ?? [];

  const buildThreadTree = (
    parentId: string | null = null,
    depth: number = 0
  ): ReactElement[] => {
    const key = parentId ?? ROOT_KEY;
    const children = directChildrenMap[key] ?? [];

    return children.map((comment) => (
        <div key={comment._id} className={depth > 0 ? 'ml-6 pl-4 border-l border-slate-200' : ''}>
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 shadow-sm">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Anonymous</span>
                <span>{formatCommentTime(comment.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900">
                {comment.text}
              </p>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <button
                  onClick={() => onReplyClick(comment._id, feedbackId)}
                  className="font-medium text-slate-600 hover:text-blue-700"
                >
                  Respond
                </button>
                {getChildren(comment._id).length > 0 && (
                  <button
                    onClick={() =>
                      setCollapsedComments((current) => ({
                        ...current,
                        [comment._id]: !current[comment._id],
                      }))
                    }
                    className="font-medium text-slate-600 hover:text-blue-700"
                  >
                    {collapsedComments[comment._id]
                      ? `Show ${getChildren(comment._id).length} response${getChildren(comment._id).length === 1 ? '' : 's'}`
                      : `Hide ${getChildren(comment._id).length} response${getChildren(comment._id).length === 1 ? '' : 's'}`}
                  </button>
                )}
              </div>
            </div>
          </div>
          {!collapsedComments[comment._id] && buildThreadTree(comment._id, depth + 1)}
        </div>
      ));
  };

  if (comments.length === 0) {
    return null;
  }

  return <div className="mt-4 space-y-3">{buildThreadTree()}</div>;
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

interface RollNumberData {
  _id: string;
  rollNumber: string;
  feedbackCount: number;
  replyCount: number;
}

export default function Home() {
  const [allRollNumbers, setAllRollNumbers] = useState<RollNumberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingMore = useRef(false);

  const fetchRollNumbers = useCallback(async (paginationCursor: string | null) => {
    const isInitial = !paginationCursor;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (paginationCursor) {
        params.set('cursor', paginationCursor);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/rollnumbers?${params.toString()}`);
      const result = await response.json();

      setAllRollNumbers((prev) =>
        paginationCursor ? [...prev, ...result.data] : result.data
      );

      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error fetching roll numbers:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const initialFetch = async () => {
      try {
        const params = new URLSearchParams();
        params.set('limit', '20');

        const response = await fetch(`/api/rollnumbers?${params.toString()}`);
        const result = await response.json();

        setAllRollNumbers(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error fetching roll numbers:', error);
      } finally {
        setLoading(false);
      }
    };

    initialFetch();
  }, []);

  useEffect(() => {
    if (!observerTarget.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor && hasMore && !isFetchingMore.current) {
          isFetchingMore.current = true;
          fetchRollNumbers(cursor).finally(() => {
            isFetchingMore.current = false;
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, fetchRollNumbers]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setAllRollNumbers([]);
    setCursor(null);
    setHasMore(false);
    setLoading(true);

    const fetchResults = async () => {
      try {
        const params = new URLSearchParams();
        params.set('limit', '20');
        if (query.trim()) {
          params.set('search', query);
        }

        const response = await fetch(`/api/rollnumbers?${params.toString()}`);
        const result = await response.json();

        setAllRollNumbers(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Error fetching roll numbers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Unsaid 💭
          </h1>
          <p className="text-gray-600">
            Some things were never said… until now.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : allRollNumbers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">
                {!searchQuery
                  ? 'No words yet… be the first one.'
                  : 'No matching roll numbers found'}
              </p>
            </div>
          ) : (
            <>
              {allRollNumbers.map((item) => (
                <Link
                  key={item._id}
                  href={`/profile/${encodeURIComponent(item.rollNumber)}`}
                >
                  <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {item.rollNumber}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {item.feedbackCount} whispers
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {item.replyCount} echoes
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {hasMore && (
                <div
                  ref={observerTarget}
                  className="flex justify-center py-8"
                >
                  {loadingMore && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-600">Loading more...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

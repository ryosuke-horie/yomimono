'use client';

import { useEffect } from 'react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">エラーが発生しました</h2>
      <button
        onClick={reset}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        再試行
      </button>
    </div>
  );
}
# 未読ブックマーク一覧の実装手順

## 1. 準備作業

### 1.1. 型定義の作成
```typescript
// types/bookmark.ts
export interface Bookmark {
  id: number;
  url: string;
  title: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 1.2. APIクライアントの型定義
```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  bookmarks?: T[];
  message?: string;
}
```

## 2. APIクライアントの実装

### 2.1. ベース設定
```typescript
// lib/api/config.ts
export const API_BASE_URL = "https://effective-yomimono-api.ryosuke-horie37.workers.dev";
```

### 2.2. ブックマークAPI実装
```typescript
// lib/api/bookmarks.ts
import { Bookmark } from '@/types/bookmark';
import { ApiResponse } from '@/types/api';
import { API_BASE_URL } from './config';

export async function getUnreadBookmarks(): Promise<Bookmark[]> {
  const response = await fetch(`${API_BASE_URL}/unread`);
  const data: ApiResponse<Bookmark> = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || '未読ブックマークの取得に失敗しました');
  }
  
  return data.bookmarks || [];
}
```

## 3. コンポーネント実装

### 3.1. BookmarkCardコンポーネント
```typescript
// components/BookmarkCard.tsx
import { Bookmark } from '@/types/bookmark';

interface Props {
  bookmark: Bookmark;
}

export function BookmarkCard({ bookmark }: Props) {
  const { title, url, createdAt } = bookmark;
  const formattedDate = new Date(createdAt).toLocaleDateString('ja-JP');
  
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <h2 className="font-bold mb-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
          {title || 'タイトルなし'}
        </a>
      </h2>
      <p className="text-sm text-gray-600 truncate mb-2">{url}</p>
      <p className="text-xs text-gray-500">{formattedDate}</p>
    </div>
  );
}
```

### 3.2. ページ実装
```typescript
// app/page.tsx
import { getUnreadBookmarks } from '@/lib/api/bookmarks';
import { BookmarkCard } from '@/components/BookmarkCard';

export default async function HomePage() {
  const bookmarks = await getUnreadBookmarks();
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">未読ブックマーク</h1>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    </main>
  );
}
```

## 4. テスト実装

### 4.1. BookmarkCardのテスト
```typescript
// tests/components/BookmarkCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BookmarkCard } from '@/components/BookmarkCard';

describe('BookmarkCard', () => {
  const mockBookmark = {
    id: 1,
    title: 'Test Title',
    url: 'https://example.com',
    isRead: false,
    createdAt: '2024-03-01T12:00:00.000Z',
    updatedAt: '2024-03-01T12:00:00.000Z'
  };

  it('displays bookmark information correctly', () => {
    render(<BookmarkCard bookmark={mockBookmark} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});
```

### 4.2. APIクライアントのテスト
```typescript
// tests/lib/api/bookmarks.test.ts
import { getUnreadBookmarks } from '@/lib/api/bookmarks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('bookmarks api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns bookmarks when API call is successful', async () => {
    const mockBookmarks = [
      {
        id: 1,
        title: 'Test',
        url: 'https://example.com',
        isRead: false,
        createdAt: '2024-03-01T12:00:00.000Z',
        updatedAt: '2024-03-01T12:00:00.000Z'
      }
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, bookmarks: mockBookmarks })
    });

    const result = await getUnreadBookmarks();
    expect(result).toEqual(mockBookmarks);
  });
});
```

## 5. エラーハンドリングの実装

### 5.1. エラー境界の作成
```typescript
// components/ErrorBoundary.tsx
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
```

### 5.2. ローディング表示の作成
```typescript
// app/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
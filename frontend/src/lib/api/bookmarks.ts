import { Bookmark } from '@/types/bookmark';
import { ApiResponse } from '@/types/api';
import { API_BASE_URL } from './config';

function getApiUrl() {
  if (typeof window === 'undefined') {
    // サーバーサイド
    return `${API_BASE_URL}/api/bookmarks/unread`;
  }
  // クライアントサイド
  return `${window.location.origin}/api/bookmarks/unread`;
}

export async function getUnreadBookmarks(): Promise<Bookmark[]> {
  try {
    const response = await fetch(getApiUrl(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    try {
      const data: ApiResponse<Bookmark> = JSON.parse(text);
      console.log('API Response:', { status: response.status, data });
      if (!data.success) {
        throw new Error(data.message || '未読ブックマークの取得に失敗しました');
      }
      return data.bookmarks || [];
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Response text:', text);
      console.error('Response status:', response.status);
      throw new Error('レスポンスの解析に失敗しました');
    }
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/config';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/unread`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'ブックマークの取得に失敗しました' },
      { status: 500 }
    );
  }
}
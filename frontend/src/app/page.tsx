import { getUnreadBookmarks } from '@/lib/api/bookmarks';
import { BookmarkCard } from '@/components/BookmarkCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function HomePage() {
  try {
    console.log('Fetching bookmarks...');
    const bookmarks = await getUnreadBookmarks();
    console.log('Fetched bookmarks:', bookmarks);
    
    if (bookmarks.length === 0) {
      return (
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">未読ブックマーク</h1>
          <p className="text-gray-600">未読のブックマークはありません。</p>
        </main>
      );
    }

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
  } catch (error) {
    console.error('Error in HomePage:', error);
    throw error;
  }
}

export { ErrorBoundary };

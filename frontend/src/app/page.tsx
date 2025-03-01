import { BookmarksList } from '@/components/BookmarksList';
import { getUnreadBookmarks } from '@/lib/api/bookmarks';

export default async function HomePage() {
  const initialBookmarks = await getUnreadBookmarks();
  return (
    <main className="container mx-auto px-4 py-8">
      <BookmarksList initialBookmarks={initialBookmarks} />
    </main>
  );
}

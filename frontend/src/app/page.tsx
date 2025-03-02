import { BookmarksList } from '@/components/BookmarksList';
import { getUnreadBookmarks } from '@/lib/api/bookmarks';
import type { Bookmark } from '@/types/bookmark';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <BookmarksList initialBookmarks={[]} />
    </main>
  );
}

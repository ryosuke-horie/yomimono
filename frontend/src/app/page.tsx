import { BookmarksList } from '@/components/BookmarksList';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <BookmarksList initialBookmarks={[]} />
    </main>
  );
}

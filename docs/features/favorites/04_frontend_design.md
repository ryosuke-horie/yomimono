# フロントエンド設計

## コンポーネント設計

### BookmarkCardの更新

```typescript
// frontend/src/components/BookmarkCard.tsx

interface Props {
  bookmark: Bookmark;
  onUpdate?: () => void;
}

export function BookmarkCard({ bookmark, onUpdate }: Props) {
  // 既存のstate
  const [isMarking, setIsMarking] = useState(false);
  // お気に入り処理中のstate追加
  const [isFavoriting, setIsFavoriting] = useState(false);

  // お気に入り状態の切り替え処理
  const handleFavoriteToggle = async () => {
    try {
      setIsFavoriting(true);
      if (bookmark.isFavorite) {
        await removeFromFavorites(bookmark.id);
      } else {
        await addToFavorites(bookmark.id);
      }
      onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsFavoriting(false);
    }
  };

  return (
    <article>
      {/* 既存のUI */}
      <button
        type="button"
        onClick={handleFavoriteToggle}
        disabled={isFavoriting}
        className={`absolute bottom-2 right-20 p-1 rounded-full ${
          isFavoriting
            ? "text-gray-400"
            : bookmark.isFavorite
            ? "text-yellow-500 hover:text-yellow-600"
            : "text-gray-400 hover:text-yellow-500"
        }`}
        title={bookmark.isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
      >
        {isFavoriting ? (
          <LoadingSpinner />
        ) : (
          <StarIcon isFilled={bookmark.isFavorite} />
        )}
      </button>
    </article>
  );
}

// スター（お気に入り）アイコンコンポーネント
function StarIcon({ isFilled }: { isFilled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill={isFilled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}
```

### お気に入り一覧ページ

```typescript
// frontend/src/app/favorites/page.tsx
import { BookmarksList } from "@/components/BookmarksList";

export default function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">お気に入り一覧</h1>
      <BookmarksList mode="favorites" />
    </main>
  );
}
```

### ヘッダーの更新

```typescript
// frontend/src/components/Header.tsx
export function Header() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-3">
        <ul className="flex gap-4">
          <li>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900"
            >
              すべて
            </Link>
          </li>
          <li>
            <Link
              href="/favorites"
              className="text-gray-600 hover:text-gray-900"
            >
              お気に入り
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
```

## データフェッチング

### Hooksの実装

```typescript
// frontend/src/hooks/useBookmarks.ts
export function useBookmarks() {
  // 既存の実装に追加
  const addToFavorites = async (id: number) => {
    const res = await fetch(`${API_BASE}/bookmarks/${id}/favorite`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to add to favorites");
  };

  const removeFromFavorites = async (id: number) => {
    const res = await fetch(`${API_BASE}/bookmarks/${id}/favorite`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove from favorites");
  };

  // お気に入り一覧取得
  const { data: favorites, mutate: mutateFavorites } = useSWR<FavoriteListResponse>(
    `${API_BASE}/bookmarks/favorites`,
    fetcher
  );

  return {
    // 既存のメソッド
    bookmarks,
    isLoading,
    mutate,
    markAsRead,
    // 新規追加メソッド
    favorites,
    addToFavorites,
    removeFromFavorites,
    mutateFavorites,
  };
}
```

### BookmarksListコンポーネントの更新

```typescript
// frontend/src/components/BookmarksList.tsx
interface Props {
  mode?: "all" | "favorites";
}

export function BookmarksList({ mode = "all" }: Props) {
  const {
    bookmarks,
    favorites,
    isLoading,
    mutate,
    mutateFavorites,
  } = useBookmarks();

  const handleUpdate = useCallback(() => {
    // 両方のデータを更新
    mutate();
    mutateFavorites();
  }, [mutate, mutateFavorites]);

  if (isLoading) return <LoadingSpinner />;

  const items = mode === "favorites" ? favorites?.bookmarks : bookmarks?.bookmarks;
  if (!items?.length) {
    return (
      <p className="text-gray-500 text-center py-8">
        {mode === "favorites"
          ? "お気に入りに登録されたブックマークはありません"
          : "ブックマークはありません"}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}
```

## 状態管理とデータ更新フロー

1. お気に入りの追加/削除
   ```mermaid
   sequenceDiagram
   participant UI as BookmarkCard
   participant Hook as useBookmarks
   participant API
   participant Cache as SWR Cache

   UI->>Hook: addToFavorites(id)
   Hook->>API: POST /bookmarks/:id/favorite
   API-->>Hook: Response
   Hook->>Cache: mutate()
   Cache-->>UI: Update UI
   ```

2. お気に入り一覧の表示
   ```mermaid
   sequenceDiagram
   participant Page as FavoritesPage
   participant List as BookmarksList
   participant Hook as useBookmarks
   participant API
   participant Cache as SWR Cache

   Page->>List: render
   List->>Hook: useBookmarks()
   Hook->>Cache: check cache
   Cache-->>API: fetch if needed
   API-->>Cache: response
   Cache-->>List: data
   List->>Page: render items

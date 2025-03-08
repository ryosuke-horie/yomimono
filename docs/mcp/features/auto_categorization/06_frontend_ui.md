# ブックマーク自動分類機能 - フロントエンド UI

## フロントエンド UI の設計

自動分類機能をユーザーに提供するためのフロントエンドコンポーネントの設計です。主要なコンポーネントとして、カテゴリフィルターと自動分類ダイアログを実装します。

### 1. カテゴリフィルターコンポーネント

カテゴリフィルターは、ブックマークをカテゴリ別に表示するためのナビゲーションコンポーネントです。

```tsx
// カテゴリフィルターコンポーネント
function CategoryFilter({ categories, onSelect }) {
  return (
    <div className="category-filter">
      <h3>カテゴリで絞り込み</h3>
      <ul className="category-list">
        <li className="category-item">
          <button 
            className="category-button" 
            onClick={() => onSelect(null)}
          >
            すべて表示
          </button>
        </li>
        {categories.map(category => (
          <li key={category.id} className="category-item">
            <button 
              className="category-button"
              onClick={() => onSelect(category.id)}
            >
              {category.name} ({category.count})
            </button>
            {category.subcategories && (
              <ul className="subcategory-list">
                {category.subcategories.map(sub => (
                  <li key={sub.id} className="subcategory-item">
                    <button 
                      className="subcategory-button"
                      onClick={() => onSelect(sub.id)}
                    >
                      {sub.name} ({sub.count})
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. 自動分類ダイアログ

自動分類機能を実行するためのダイアログコンポーネントです。

```tsx
// 自動分類ダイアログコンポーネント
function AutoCategorizeDialog({ isOpen, onClose, onCategorize, bookmarkIds }) {
  const [detailLevel, setDetailLevel] = useState("detailed");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 分類実行関数
  const handleCategorize = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const categorizeResult = await onCategorize({
        bookmarkIds,
        options: {
          detailLevel,
          forceRecategorize: false
        }
      });
      
      setResult(categorizeResult);
    } catch (err) {
      setError(err.message || '分類処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 分類結果の表示
  const renderCategorizeResult = () => {
    if (!result) return null;
    
    return (
      <div className="categorize-result">
        <h3>分類結果</h3>
        <p>{result.categorized}件のブックマークを分類しました</p>
        
        {Object.entries(result.categories).map(([category, subcategories]) => (
          <div key={category} className="category-group">
            <h4>{category}</h4>
            {subcategories.length > 0 && (
              <ul className="subcategory-list">
                {subcategories.map(sub => (
                  <li key={sub} className="subcategory-item">{sub}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // カテゴリカスタマイズフォーム
  const renderCustomizeForm = () => {
    if (!result) return null;
    
    return (
      <div className="customize-form">
        <h3>カテゴリの調整</h3>
        <p>必要に応じて、分類結果を調整できます</p>
        
        <form onSubmit={(e) => e.preventDefault()}>
          {Object.entries(result.categories).map(([category, subcategories]) => (
            <div key={category} className="category-edit-group">
              <div className="category-edit-header">
                <input
                  type="text"
                  defaultValue={category}
                  className="category-edit-input"
                  placeholder="カテゴリ名"
                />
              </div>
              
              {subcategories.length > 0 && (
                <div className="subcategory-edit-list">
                  {subcategories.map(sub => (
                    <div key={sub} className="subcategory-edit-item">
                      <input
                        type="text"
                        defaultValue={sub}
                        className="subcategory-edit-input"
                        placeholder="サブカテゴリ名"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="form-actions">
            <button
              type="button"
              className="apply-button"
              onClick={() => applyCustomizations()}
            >
              変更を適用
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  // モーダルの中身
  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>ブックマークの自動分類</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {!result ? (
            <div className="categorize-options">
              <p>
                {bookmarkIds && bookmarkIds.length > 0
                  ? `選択された${bookmarkIds.length}件のブックマークを分類します`
                  : '未分類のブックマークを自動的に分類します'}
              </p>
              
              <div className="option-group">
                <label htmlFor="detail-level">分類の詳細レベル：</label>
                <select
                  id="detail-level"
                  value={detailLevel}
                  onChange={(e) => setDetailLevel(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="simple">カテゴリのみ</option>
                  <option value="detailed">サブカテゴリまで</option>
                </select>
              </div>
              
              <button
                className="categorize-button"
                onClick={handleCategorize}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="spinner"></div>
                ) : '分類を実行'}
              </button>
            </div>
          ) : (
            <>
              {renderCategorizeResult()}
              {renderCustomizeForm()}
            </>
          )}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. 拡張されたブックマークリスト

カテゴリフィルター機能を統合したブックマークリストコンポーネントです。

```tsx
// カテゴリフィルター付きブックマークリスト
function CategorizedBookmarksList() {
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // データの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // カテゴリデータの取得
        const categoriesResponse = await fetch('/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
        
        // ブックマークデータの取得（カテゴリフィルターに応じて）
        const bookmarksUrl = selectedCategoryId
          ? `/api/bookmarks?categoryId=${selectedCategoryId}`
          : '/api/bookmarks/unread';
        
        const bookmarksResponse = await fetch(bookmarksUrl);
        const bookmarksData = await bookmarksResponse.json();
        setBookmarks(bookmarksData.bookmarks || []);
        
      } catch (err) {
        setError('データの取得中にエラーが発生しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCategoryId]);
  
  // 自動分類の実行
  const handleCategorize = async (params) => {
    try {
      const response = await fetch('/api/bookmarks/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '分類処理中にエラーが発生しました');
      }
      
      // データの再取得
      await fetchData();
      
      return result;
    } catch (err) {
      console.error('分類エラー:', err);
      throw err;
    }
  };
  
  return (
    <div className="bookmarks-container">
      <div className="sidebar">
        <CategoryFilter 
          categories={categories} 
          onSelect={setSelectedCategoryId}
        />
        
        <div className="sidebar-actions">
          <button
            className="action-button"
            onClick={() => setIsDialogOpen(true)}
          >
            自動分類を実行
          </button>
        </div>
      </div>
      
      <div className="main-content">
        <div className="header">
          <h1>
            {selectedCategoryId 
              ? categories.find(c => c.id === selectedCategoryId)?.name || 'ブックマーク'
              : '未読ブックマーク'}
          </h1>
        </div>
        
        {isLoading ? (
          <div className="loading">読み込み中...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">ブックマークがありません</div>
        ) : (
          <div className="bookmarks-grid">
            {bookmarks.map(bookmark => (
              <BookmarkCard 
                key={bookmark.id} 
                bookmark={bookmark}
                onUpdate={() => fetchData()}
              />
            ))}
          </div>
        )}
      </div>
      
      <AutoCategorizeDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCategorize={handleCategorize}
      />
    </div>
  );
}
```

### 4. 強化されたブックマークカード

カテゴリ情報を表示するよう拡張されたブックマークカードコンポーネントです。

```tsx
// カテゴリ表示対応ブックマークカード
function BookmarkCard({ bookmark, onUpdate }) {
  const { id, title, url, category, subcategory, isRead, createdAt } = bookmark;
  const formattedDate = new Date(createdAt).toLocaleDateString("ja-JP");
  
  const [isMarking, setIsMarking] = useState(false);
  
  // 既読マーク処理
  const handleMarkAsRead = async () => {
    try {
      setIsMarking(true);
      const response = await fetch(`/api/bookmarks/${id}/read`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error);
    } finally {
      setIsMarking(false);
    }
  };
  
  return (
    <article className="bookmark-card">
      {/* 既読マークボタン */}
      <button
        type="button"
        onClick={handleMarkAsRead}
        disabled={isRead || isMarking}
        className="read-button"
      >
        {isMarking ? '処理中...' : (isRead ? '既読' : '未読')}
      </button>
      
      {/* カテゴリ表示 */}
      <div className="bookmark-category">
        {category && (
          <span className="category-tag">
            {category}
            {subcategory && <span className="subcategory-tag">{subcategory}</span>}
          </span>
        )}
      </div>
      
      {/* タイトルとURL */}
      <h2 className="bookmark-title">
        <a href={url} target="_blank" rel="noopener noreferrer">
          {title || 'タイトルなし'}
        </a>
      </h2>
      <p className="bookmark-url">{url}</p>
      
      {/* 日付 */}
      <div className="bookmark-meta">
        <span className="bookmark-date">{formattedDate}</span>
      </div>
    </article>
  );
}
```

## UI 設計のポイント

### 1. レスポンシブデザイン

- カテゴリフィルターとブックマークリストのレイアウトは、画面サイズに応じて調整
- モバイル画面ではカテゴリリストがドロワーメニューとして表示
- グリッドレイアウトは画面サイズに応じて列数が変化（1〜4列）

### 2. ユーザーエクスペリエンス

- 分類処理中はローディングインジケータを表示
- 分類結果はリアルタイムで確認・編集可能
- 分類内容の変更がすぐに反映される直感的なUI

### 3. アクセシビリティ

- キーボードナビゲーション対応
- スクリーンリーダー対応の適切なラベルとARIA属性
- コントラスト比を考慮した配色

### 4. ビジュアルデザイン

- カテゴリ情報は色付きタグとして視覚的に表示
- カテゴリごとに一貫した色分け
- 階層構造が視覚的に理解しやすいインデント設計

### 5. 状態管理と通知

- 処理結果は適切な通知で表示
- エラー状態の明示的な表示
- 処理の進捗状況の可視化

## スタイリング

```css
/* カテゴリフィルターのスタイル */
.category-filter {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.category-filter h3 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #374151;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  margin-bottom: 0.5rem;
}

.category-button {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-button:hover {
  background-color: #e5e7eb;
}

.category-button.active {
  background-color: #e5e7eb;
  font-weight: 500;
}

.subcategory-list {
  list-style: none;
  padding-left: 1.5rem;
  margin: 0.25rem 0 0.5rem;
}

.subcategory-item {
  margin-bottom: 0.25rem;
}

.subcategory-button {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0.35rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #4b5563;
}

.subcategory-button:hover {
  background-color: #e5e7eb;
}

.subcategory-button.active {
  background-color: #e5e7eb;
  font-weight: 500;
}

/* 自動分類ダイアログのスタイル */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.modal.open {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.categorize-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-group label {
  font-weight: 500;
  color: #374151;
}

.option-group select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background-color: white;
}

.categorize-button {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.categorize-button:hover {
  background-color: #2563eb;
}

.categorize-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.categorize-result {
  margin-bottom: 2rem;
}

.categorize-result h3 {
  font-size: 1.1rem;
  margin-top: 0;
  color: #111827;
}

.category-group {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 4px;
}

.category-group h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #111827;
}

.customize-form {
  margin-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.customize-form h3 {
  font-size: 1.1rem;
  margin-top: 0;
  color: #111827;
}

.category-edit-group {
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 4px;
}

.category-edit-header {
  margin-bottom: 0.75rem;
}

.category-edit-input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

.subcategory-edit-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1rem;
}

.subcategory-edit-input {
  width: 100%;
  padding: 0.4rem;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.apply-button {
  padding: 0.6rem 1.2rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-button:hover {
  background-color: #2563eb;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #b91c1c;
}

/* ブックマークリストのスタイル */
.bookmarks-container {
  display: flex;
  gap: 2rem;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.main-content {
  flex-grow: 1;
}

.sidebar-actions {
  margin-top: 1rem;
}

.action-button {
  width: 100%;
  padding: 0.6rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
}

.action-button:hover {
  background-color: #2563eb;
}

.header {
  margin-bottom: 1.5rem;
}

.header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #111827;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.error {
  padding: 1rem;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #b91c1c;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  background-color: #f9fafb;
  border-radius: 8px;
}

/* ブックマークカードのスタイル */
.bookmark-card {
  position: relative;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
  transition: box-shadow 0.2s;
}

.bookmark-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.read-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  background-color: #e5e7eb;
  color: #4b5563;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.read-button:hover:not(:disabled) {
  background-color: #d1d5db;
}

.read-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bookmark-category {
  margin-bottom: 0.75rem;
  padding-right: 3.5rem;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.subcategory-tag {
  margin-left: 0.25rem;
  padding-left: 0.25rem;
  border-left: 1px solid #93c5fd;
  color: #3b82f6;
}

.bookmark-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  line-height: 1.4;
}

.bookmark-title a {
  color: #111827;
  text-decoration: none;
}

.bookmark-title a:hover {
  text-decoration: underline;
}

.bookmark-url {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-meta {
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* モバイル対応 */
@media (max-width: 768px) {
  .bookmarks-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .bookmarks-grid {
    grid-template-columns: 1fr;
  }
}
```

## 実装の注意点

1. **状態管理**
   - 大量のブックマークとカテゴリデータを効率的に管理するため、適切な状態管理が必要
   - ページネーションの実装により、パフォーマンスを最適化

2. **ユーザーフィードバック**
   - 分類処理の進捗状況を視覚的に伝える
   - エラーメッセージは具体的で、次のアクションが明確なものにする

3. **パフォーマンス最適化**
   - 大量のカテゴリやブックマークを効率的に表示するための仮想化リスト
   - 必要に応じた遅延読み込み（Lazy Loading）の実装

4. **アクセシビリティ**
   - 全てのインタラクティブ要素はキーボードでアクセス可能に
   - 適切なARIA属性とフォーカス管理の実装

5. **多言語対応**
   - テキストリソースの外部化による多言語対応の準備
   - RTL（右から左）レイアウトのサポート検討

## モバイル対応デザイン

モバイルデバイスでのUX向上のための追加実装ポイント:

1. カテゴリフィルターをスワイプで表示可能なドロワーメニューとして実装
2. タッチインタラクションの最適化（タップ領域を十分に確保）
3. スクロールパフォーマンスの最適化
4. モバイルでの自動分類ダイアログUIの調整（フルスクリーン表示など）

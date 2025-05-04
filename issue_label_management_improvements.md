# ラベル管理機能の改善ポイント

## 概要
ラベル管理機能の実装後のレビューにより、いくつかの改善ポイントが見つかりました。これらの改善を実装することで、コードの保守性、アクセシビリティ、および機能性を向上させることができます。

## 優先度
中：次回の機能追加やリファクタリング時に対応

## 改善ポイント

### 1. アクセシビリティの包括的な改善

#### モーダルコンポーネントのフォーカス管理の強化
- **現状**: LabelDeleteConfirmコンポーネントでは初期フォーカスの設定はできていますが、完全なフォーカストラップが実装されていません。
- **改善案**: フォーカストラップを完全に実装し、Tabキーを押したときに最初と最後の要素間でフォーカスが循環するようにする。
- **コード例**:
```typescript
// フォーカストラップの完全実装
useEffect(() => {
  const focusableElements = dialogRef.current?.querySelectorAll(
    'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  if (!focusableElements || focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // 初期フォーカス
  firstElement.focus();
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    // Shift+Tabが押された場合かつ現在のフォーカスが最初の要素にある場合
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tabが押された場合かつ現在のフォーカスが最後の要素にある場合
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  dialogRef.current?.addEventListener('keydown', handleTabKey);
  return () => {
    dialogRef.current?.removeEventListener('keydown', handleTabKey);
  };
}, []);
```

#### WAI-ARIA対応の強化
- **現状**: 基本的なaria属性は設定されていますが、より包括的なWAI-ARIA対応が必要です。
- **改善案**: モーダルの閉じられた状態を反映するために`aria-hidden`属性を適切に使用し、動的な状態変化を`aria-live`領域で通知する。
- **コード例**:
```tsx
// モーダル外のコンテンツに対して aria-hidden を設定
// モーダル内に状態変化を通知するための aria-live 領域を追加
<div role="status" aria-live="polite" className="sr-only">
  {isDeleting ? "ラベルを削除中です" : ""}
</div>
```

### 2. エラー処理の改善

#### API関数のエラー処理の統一
- **現状**: API関数でのエラー処理は基本的なものですが、一貫性と詳細なエラーメッセージが不足しています。
- **改善案**: エラーオブジェクトに詳細情報を含めるための統一的なアプローチを実装する。
- **コード例**:
```typescript
// 統一されたAPIエラーハンドリング
const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.message || defaultMessage, {
      cause: {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      }
    });
  } catch (e) {
    // JSONパース失敗など
    throw new Error(defaultMessage, {
      cause: {
        status: response.status,
        statusText: response.statusText
      }
    });
  }
};

// 関数内での使用例
if (!response.ok) {
  await handleApiError(response, `Failed to delete label with ID: ${id}`);
}
```

#### フロントエンドでのエラー表示の強化
- **現状**: エラーは基本的に表示されていますが、ユーザーへのガイダンスが限定的です。
- **改善案**: エラーメッセージに復旧手順や代替手段を含め、問題を明確に説明する。
- **コード例**:
```tsx
// エラー表示コンポーネントの改善
{error && (
  <div className="px-4 py-3 bg-red-50 text-red-700 text-sm" role="alert">
    <p className="font-medium">エラーが発生しました</p>
    <p>{error.message}</p>
    <p className="mt-1">
      {/* エラーの種類に応じた回復手順 */}
      {error.message.includes("network") ? 
        "ネットワーク接続を確認して再試行してください。" : 
        "しばらく待ってから再度お試しください。"}
    </p>
  </div>
)}
```

### 3. コード構造と再利用性の改善

#### モーダルコンポーネントの抽象化
- **現状**: LabelDeleteConfirmは単一の目的のために実装されています。
- **改善案**: 汎用的なModalコンポーネントとして抽象化し、異なるコンテンツで再利用できるようにする。
- **コード例**:
```typescript
// 汎用モーダルコンポーネント
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // アクセシビリティとイベントハンドラの実装（現行と同様）
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        onKeyDown={handleOverlayKeyDown}
        role="button"
        tabIndex={0}
      />
      
      {/* モーダルコンテンツ */}
      <div className="flex items-center justify-center min-h-full p-4">
        <div
          ref={dialogRef}
          className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleDialogKeyDown}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <h3
              className="text-lg leading-6 font-medium text-gray-900"
              id="modal-headline"
            >
              {title}
            </h3>
            <div className="mt-2">
              {children}
            </div>
          </div>
          
          {footer && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 使用例
function LabelDeleteConfirm({ label, onConfirm, onCancel, isDeleting, error }) {
  return (
    <Modal
      isOpen={!!label}
      onClose={onCancel}
      title="ラベルを削除しますか？"
      footer={
        <>
          <button
            type="button"
            onClick={() => onConfirm(label.id)}
            disabled={isDeleting}
            className="btn btn-danger"
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="btn btn-secondary"
          >
            キャンセル
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-500">
        ラベル「{label.name}」を削除します。この操作は取り消せません。
        {label.articleCount > 0 && (
          <span className="block mt-2 text-red-600 font-medium">
            このラベルは現在 {label.articleCount} 件の記事に使用されています。
            削除すると、これらの記事からラベルが削除されます。
          </span>
        )}
      </p>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          {error.message}
        </div>
      )}
    </Modal>
  );
}
```

#### フック内のロジック最適化
- **現状**: useManageLabelsフックは多くの責務を持っています。
- **改善案**: 関連する状態と操作をより小さなフックに分割する。
- **コード例**:
```typescript
// ラベル作成に特化したフック
function useCreateLabel() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createLabel(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labelKeys.lists() });
      setIsFormOpen(false);
    },
  });
  
  return {
    isFormOpen,
    openForm: () => setIsFormOpen(true),
    closeForm: () => setIsFormOpen(false),
    createLabel: (name: string, description?: string) =>
      mutation.mutate({ name, description }),
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

// 同様に編集と削除のフックも分割
// ...

// メインのフックでは、これらの特化したフックを組み合わせて使用
function useManageLabels() {
  const { data: labels = [], isLoading, error } = useQuery(...);
  const createLabelHook = useCreateLabel();
  const editLabelHook = useEditLabel();
  const deleteLabelHook = useDeleteLabel();
  
  return {
    labels,
    isLoading,
    error,
    ...createLabelHook,
    ...editLabelHook,
    ...deleteLabelHook,
  };
}
```

### 4. パフォーマンスの最適化

#### 無駄なレンダリングの防止
- **現状**: 一部のコンポーネントは必要以上に再レンダリングされる可能性があります。
- **改善案**: React.memo、useCallbackとuseMemoを適切に使用してパフォーマンスを最適化する。
- **コード例**:
```typescript
// LabelDeleteConfirmコンポーネントの最適化
const LabelDeleteConfirm = React.memo(({ label, onConfirm, onCancel, isDeleting, error }: Props) => {
  // コンポーネントの実装
});

// フック内でのコールバック最適化
const openDeleteConfirm = useCallback((labelId: number) => {
  setDeleteConfirmLabelId(labelId);
}, []);

const closeDeleteConfirm = useCallback(() => {
  setDeleteConfirmLabelId(null);
}, []);
```

#### API呼び出しの最適化
- **現状**: fetchLabelById関数が実装されていますが、使用されていません。
- **改善案**: 未使用の関数を削除するか、必要な場合は特定のラベルの詳細情報取得に使用する。
- **コード例**:
```typescript
// 特定ラベルの詳細情報取得のためのクエリフックを作成する場合
function useLabelDetails(id: number | null) {
  return useQuery({
    queryKey: labelKeys.detail(id),
    queryFn: () => (id ? fetchLabelById(id) : null),
    enabled: id !== null,
  });
}
```

## 今後の方針
これらの改善は機能の正常動作を妨げるものではありませんが、今後のメンテナンス性と拡張性を高めるために取り組むべき項目です。特にモーダルコンポーネントの抽象化は、他の機能（例：記事の削除確認）でも同様のUIが必要になる場合に役立ちます。

アクセシビリティの改善は、より多くのユーザーが問題なくアプリケーションを使用できるようにするために重要です。次のリファクタリングフェーズでこれらの改善を優先的に対応することをお勧めします。
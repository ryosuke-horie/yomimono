import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LabelsPage from "./page";

// モックコンポーネント
vi.mock("@/features/labels/components/LabelCreateForm", () => ({
	LabelCreateForm: ({ onSubmit, onCancel }: any) => (
		<div data-testid="label-create-form">
			<button onClick={() => onSubmit("test", "test description")}>Submit</button>
			<button onClick={onCancel}>Cancel</button>
		</div>
	),
}));

vi.mock("@/features/labels/components/LabelList", () => ({
	LabelList: ({ labels, onEdit, onDelete }: any) => (
		<div data-testid="label-list">
			{labels?.map((label: any) => (
				<div key={label.id}>
					<span>{label.name}</span>
					<button onClick={() => onEdit(label.id)}>Edit</button>
					<button onClick={() => onDelete(label.id)}>Delete</button>
				</div>
			))}
		</div>
	),
}));

vi.mock("@/features/labels/components/LabelEditForm", () => ({
	LabelEditForm: ({ label, onSubmit, onCancel }: any) => (
		<div data-testid="label-edit-form">
			<span>Editing: {label.name}</span>
			<button onClick={() => onSubmit(label.id, "updated description")}>Update</button>
			<button onClick={onCancel}>Cancel Edit</button>
		</div>
	),
}));

vi.mock("@/features/labels/components/LabelDeleteConfirm", () => ({
	LabelDeleteConfirm: ({ label, onConfirm, onCancel }: any) => (
		<div data-testid="label-delete-confirm">
			<span>Delete: {label.name}</span>
			<button onClick={() => onConfirm(label.id)}>Confirm Delete</button>
			<button onClick={onCancel}>Cancel Delete</button>
		</div>
	),
}));

// useManageLabelsフックをモック
const mockUseManageLabels = vi.fn();
vi.mock("@/features/labels/hooks/useManageLabels", () => ({
	useManageLabels: () => mockUseManageLabels(),
}));

const createTestQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				staleTime: 0,
				gcTime: 0,
			},
		},
	});
};

const renderWithQueryClient = (component: React.ReactElement) => {
	const queryClient = createTestQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
	);
};

describe("LabelsPage", () => {
	const defaultMockReturn = {
		labels: [
			{ id: 1, name: "テストラベル1", description: "説明1" },
			{ id: 2, name: "テストラベル2", description: "説明2" },
		],
		isLoadingLabels: false,
		labelsError: null,
		isCreateFormOpen: false,
		openCreateForm: vi.fn(),
		closeCreateForm: vi.fn(),
		createLabel: vi.fn(),
		isCreatingLabel: false,
		createLabelError: null,
		editingLabelId: null,
		startEdit: vi.fn(),
		cancelEdit: vi.fn(),
		getEditingLabel: vi.fn(() => null),
		updateLabelDescription: vi.fn(),
		isUpdatingLabel: false,
		updateLabelError: null,
		deleteConfirmLabelId: null,
		openDeleteConfirm: vi.fn(),
		closeDeleteConfirm: vi.fn(),
		getDeleteConfirmLabel: vi.fn(() => null),
		deleteLabel: vi.fn(),
		isDeletingLabel: false,
		deleteLabelError: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseManageLabels.mockReturnValue(defaultMockReturn);
	});

	it("ページタイトルと新規作成ボタンを表示する", () => {
		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByText("ラベル設定")).toBeInTheDocument();
		expect(screen.getByText("新しいラベルを作成")).toBeInTheDocument();
	});

	it("新規作成ボタンクリック時にopenCreateFormが呼ばれる", () => {
		const openCreateForm = vi.fn();
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			openCreateForm,
		});

		renderWithQueryClient(<LabelsPage />);

		fireEvent.click(screen.getByText("新しいラベルを作成"));
		expect(openCreateForm).toHaveBeenCalled();
	});

	it("ローディング状態を正しく表示する", () => {
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			isLoadingLabels: true,
		});

		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByText("ラベルを読み込み中...")).toBeInTheDocument();
	});

	it("エラー状態を正しく表示する", () => {
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			labelsError: new Error("テストエラー"),
		});

		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByText("ラベルの読み込みに失敗しました")).toBeInTheDocument();
		expect(screen.getByText("テストエラー")).toBeInTheDocument();
	});

	it("作成フォームが開いている時に表示する", () => {
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			isCreateFormOpen: true,
		});

		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByTestId("label-create-form")).toBeInTheDocument();
	});

	it("編集フォームが開いている時に表示する", () => {
		const editingLabel = { id: 1, name: "編集中ラベル", description: "説明" };
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			getEditingLabel: vi.fn(() => editingLabel),
		});

		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByTestId("label-edit-form")).toBeInTheDocument();
		expect(screen.getByText("Editing: 編集中ラベル")).toBeInTheDocument();
	});

	it("削除確認ダイアログが開いている時に表示する", () => {
		const deleteConfirmLabel = { id: 1, name: "削除予定ラベル", description: "説明" };
		mockUseManageLabels.mockReturnValue({
			...defaultMockReturn,
			getDeleteConfirmLabel: vi.fn(() => deleteConfirmLabel),
		});

		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByTestId("label-delete-confirm")).toBeInTheDocument();
		expect(screen.getByText("Delete: 削除予定ラベル")).toBeInTheDocument();
	});

	it("ラベル一覧を正しく表示する", () => {
		renderWithQueryClient(<LabelsPage />);

		expect(screen.getByTestId("label-list")).toBeInTheDocument();
		expect(screen.getByText("登録済みラベル一覧")).toBeInTheDocument();
		expect(screen.getByText("テストラベル1")).toBeInTheDocument();
		expect(screen.getByText("テストラベル2")).toBeInTheDocument();
	});
});
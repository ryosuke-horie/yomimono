import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { BookmarkSummary } from "./BookmarkSummary";

describe("BookmarkSummary", () => {
	beforeEach(() => {
		// モックナビゲーターの初期化
		Object.assign(navigator, {
			clipboard: {
				writeText: vi.fn().mockResolvedValue(undefined),
			},
		});
	});

	test("要約がない場合に適切なメッセージを表示する", () => {
		render(<BookmarkSummary summary={null} summaryUpdatedAt={null} />);
		expect(screen.getByText("要約がありません")).toBeInTheDocument();
	});

	test("要約がある場合にタイトルと内容を表示する", () => {
		const summary = "これはテスト要約です";
		const summaryUpdatedAt = "2024-01-01T00:00:00Z";

		render(
			<BookmarkSummary summary={summary} summaryUpdatedAt={summaryUpdatedAt} />,
		);

		expect(screen.getByText("要約")).toBeInTheDocument();
		expect(screen.getByText(summary)).toBeInTheDocument();
		expect(screen.getByText("2024/1/1")).toBeInTheDocument();
	});

	test("コピーボタンをクリックしてクリップボードにコピーできる", async () => {
		const summary = "コピーするテキスト";
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: { writeText: writeTextMock },
		});

		render(<BookmarkSummary summary={summary} summaryUpdatedAt={null} />);

		const copyButton = screen.getByText("コピー");
		fireEvent.click(copyButton);

		expect(writeTextMock).toHaveBeenCalledWith(summary);
		await waitFor(() => {
			expect(screen.getByText("コピー済み")).toBeInTheDocument();
		});
	});

	test("コピー失敗時にエラーログが出力される", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const writeTextMock = vi.fn().mockRejectedValue(new Error("コピー失敗"));
		Object.assign(navigator, {
			clipboard: { writeText: writeTextMock },
		});

		render(<BookmarkSummary summary="テスト" summaryUpdatedAt={null} />);

		const copyButton = screen.getByText("コピー");
		fireEvent.click(copyButton);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to copy summary:",
				expect.any(Error),
			);
		});

		consoleSpy.mockRestore();
	});

	test("展開ボタンで要約の表示/非表示を切り替えできる", () => {
		render(<BookmarkSummary summary="テスト要約" summaryUpdatedAt={null} />);

		const expandButton = screen.getByText("展開");
		fireEvent.click(expandButton);

		expect(screen.getByText("折りたたむ")).toBeInTheDocument();

		fireEvent.click(screen.getByText("折りたたむ"));
		expect(screen.getByText("展開")).toBeInTheDocument();
	});

	test("複数行の要約を正しく表示する", () => {
		const multilineSummary = "一行目\n二行目\n• 箇条書き";

		render(
			<BookmarkSummary summary={multilineSummary} summaryUpdatedAt={null} />,
		);

		expect(screen.getByText("一行目")).toBeInTheDocument();
		expect(screen.getByText("二行目")).toBeInTheDocument();
		expect(screen.getByText("• 箇条書き")).toBeInTheDocument();
	});

	test("summaryUpdatedAtがない場合は日付を表示しない", () => {
		render(<BookmarkSummary summary="要約" summaryUpdatedAt={null} />);

		expect(
			screen.queryByText(/\d{4}\/\d{1,2}\/\d{1,2}/),
		).not.toBeInTheDocument();
	});

	test("箇条書きの項目にはマージンが適用される", () => {
		const summaryWithBullet = "• 箇条書き項目";

		render(
			<BookmarkSummary summary={summaryWithBullet} summaryUpdatedAt={null} />,
		);

		const bulletItem = screen.getByText("• 箇条書き項目");
		expect(bulletItem).toHaveClass("ml-4");
	});
});

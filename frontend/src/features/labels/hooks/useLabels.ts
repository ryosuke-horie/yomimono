import { API_BASE_URL } from "@/lib/api/config";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Label } from "../types";

// APIレスポンスの型定義
interface LabelsApiResponse {
	labels: Label[];
}

// ラベル一覧を取得する非同期関数
const fetchLabels = async (): Promise<Label[]> => {
	const response = await fetch(`${API_BASE_URL}/api/labels`);
	if (!response.ok) {
		throw new Error("Failed to fetch labels");
	}
	const data: LabelsApiResponse = await response.json();
	// APIが articleCount を返さない場合はここで計算するか、LabelFilter側で別途取得する
	return data.labels;
};

export function useLabels() {
	const [selectedLabelName, setSelectedLabelName] = useState<
		string | undefined
	>(undefined);

	// TanStack Query を使用してラベル一覧を取得
	const {
		data: labels = [], // デフォルト値を空配列に設定
		isLoading,
		error,
	} = useQuery<Label[], Error>({
		// 型引数を指定
		queryKey: ["labels"], // クエリキーを設定
		queryFn: fetchLabels, // データ取得関数を指定
		staleTime: 5 * 60 * 1000, // 5分間はキャッシュを有効にする
	});

	// ラベル選択ハンドラ (useCallback でメモ化)
	const handleLabelSelect = useCallback((labelName: string | undefined) => {
		setSelectedLabelName(labelName);
	}, []);

	return {
		labels,
		selectedLabelName,
		setSelectedLabelName: handleLabelSelect,
		isLoading,
		error,
	};
}

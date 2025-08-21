"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/useToast";
import { createQueryClient, setGlobalShowToast } from "@/lib/api/queryClient";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	// QueryClientのインスタンスがコンポーネントのライフサイクルごとに
	// 再生成されないようにuseStateで管理する
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

/**
 * Toastプロバイダー内で使用するためのコンポーネント
 * QueryClientにグローバルエラーハンドラーを設定する
 */
export function QueryErrorHandler() {
	const { showToast } = useToast();

	useEffect(() => {
		// Toastプロバイダー内でshowToastをグローバルに設定
		setGlobalShowToast(showToast);
	}, [showToast]);

	return null;
}

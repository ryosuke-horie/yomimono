"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	// QueryClientのインスタンスがコンポーネントのライフサイクルごとに
	// 再生成されないようにuseStateで管理する
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// staleTimeを設定すると、指定時間内はキャッシュが新鮮とみなされ、
						// マウント時やウィンドウフォーカス時などに自動再取得が行われなくなる
						// 必要に応じて調整する (例: 5分 = 1000 * 60 * 5)
						staleTime: 1000 * 60 * 5, // 5 minutes
						// refetchOnWindowFocus: false, // 必要ならウィンドウフォーカス時の再取得を無効化
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

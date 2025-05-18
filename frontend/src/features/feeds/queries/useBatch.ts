import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { executeBatchApi, getBatchLogsApi } from "./api";
import { queryKeys } from "./queryKeys";

export function useExecuteBatch() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { feedIds: number[] }) => executeBatchApi(data),
		onSuccess: () => {
			// バッチログを更新
			queryClient.invalidateQueries({ queryKey: queryKeys.batchLogs() });
		},
	});
}

export function useBatchLogs() {
	return useQuery({
		queryKey: queryKeys.batchLogs(),
		queryFn: () => getBatchLogsApi(),
		refetchInterval: 5000, // 5秒ごとに更新
	});
}

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { fetchLabels } from "../queries/api";
import type { Label } from "../types";

export function useLabels() {
	const [selectedLabelName, setSelectedLabelName] = useState<
		string | undefined
	>(undefined);

	const {
		data: labels = [],
		isLoading,
		error,
	} = useQuery<Label[], Error>({
		queryKey: ["labels"],
		queryFn: fetchLabels,
		staleTime: 5 * 60 * 1000,
	});

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

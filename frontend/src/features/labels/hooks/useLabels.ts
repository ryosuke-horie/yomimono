import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { API_BASE_URL } from "@/lib/api/config";
import type { Label } from "../types";

interface LabelsApiResponse {
	labels: Label[];
}

const fetchLabels = async (): Promise<Label[]> => {
	const response = await fetch(`${API_BASE_URL}/api/labels`);
	if (!response.ok) {
		throw new Error("Failed to fetch labels");
	}
	const data: LabelsApiResponse = await response.json();
	return data.labels;
};

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

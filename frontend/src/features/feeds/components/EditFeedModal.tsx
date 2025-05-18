import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { type FormEvent, useState } from "react";
import { useUpdateRSSFeed } from "../queries/useRSSFeeds";
import type { RSSFeed } from "../types";

interface EditFeedModalProps {
	feed: RSSFeed;
	isOpen: boolean;
	onClose: () => void;
}

export function EditFeedModal({ feed, isOpen, onClose }: EditFeedModalProps) {
	const [formData, setFormData] = useState({
		name: feed.name,
		url: feed.url,
		isActive: feed.isActive,
	});

	const { mutate: updateFeed, isPending } = useUpdateRSSFeed();

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		updateFeed(
			{ id: feed.id, data: formData },
			{
				onSuccess: () => {
					onClose();
				},
			},
		);
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="フィードを編集">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label htmlFor="name" className="block text-sm font-medium mb-2">
						フィード名
					</label>
					<input
						type="text"
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder="フィード名"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label htmlFor="url" className="block text-sm font-medium mb-2">
						RSS URL
					</label>
					<input
						type="url"
						id="url"
						value={formData.url}
						onChange={(e) => setFormData({ ...formData, url: e.target.value })}
						placeholder="RSS URL"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="flex items-center">
					<input
						type="checkbox"
						id="isActive"
						checked={formData.isActive}
						onChange={(e) =>
							setFormData({ ...formData, isActive: e.target.checked })
						}
						className="mr-2"
					/>
					<label htmlFor="isActive" className="text-sm font-medium">
						有効
					</label>
				</div>

				<div className="flex justify-end gap-2 pt-4">
					<Button
						type="button"
						onClick={onClose}
						variant="secondary"
						disabled={isPending}
					>
						キャンセル
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "更新中..." : "更新"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}

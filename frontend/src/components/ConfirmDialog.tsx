import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";

interface ConfirmDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

export function ConfirmDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "削除",
	cancelText = "キャンセル",
	isLoading = false,
}: ConfirmDialogProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="py-3">
				<p className="text-gray-600">{message}</p>
			</div>

			<div className="flex justify-end gap-2 pt-4">
				<Button
					type="button"
					onClick={onClose}
					variant="secondary"
					disabled={isLoading}
				>
					{cancelText}
				</Button>
				<Button
					type="button"
					onClick={onConfirm}
					variant="danger"
					disabled={isLoading}
				>
					{isLoading ? "処理中..." : confirmText}
				</Button>
			</div>
		</Modal>
	);
}

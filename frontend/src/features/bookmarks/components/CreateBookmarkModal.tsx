import { Modal } from "@/components/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateBookmark } from "../queries/useCreateBookmark";

const bookmarkSchema = z.object({
	title: z.string().min(1, "タイトルは必須です"),
	url: z.string().url("有効なURLを入力してください"),
});

type BookmarkFormData = z.infer<typeof bookmarkSchema>;

interface CreateBookmarkModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateBookmarkModal({
	isOpen,
	onClose,
}: CreateBookmarkModalProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<BookmarkFormData>({
		resolver: zodResolver(bookmarkSchema),
	});

	const { mutate: createBookmark, isPending } = useCreateBookmark();

	const onSubmit = (data: BookmarkFormData) => {
		createBookmark(data, {
			onSuccess: () => {
				reset();
				onClose();
			},
		});
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="記事を追加">
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				{/* タイトル */}
				<div>
					<label
						htmlFor="title"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						タイトル
					</label>
					<input
						type="text"
						id="title"
						{...register("title")}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="記事のタイトル"
					/>
					{errors.title && (
						<p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
					)}
				</div>

				{/* URL */}
				<div>
					<label
						htmlFor="url"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						URL
					</label>
					<input
						type="url"
						id="url"
						{...register("url")}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="https://example.com/article"
					/>
					{errors.url && (
						<p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
					)}
				</div>

				{/* ボタン */}
				<div className="flex justify-end gap-3 pt-4">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
						disabled={isPending}
					>
						キャンセル
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isPending}
					>
						{isPending ? "追加中..." : "追加"}
					</button>
				</div>
			</form>
		</Modal>
	);
}

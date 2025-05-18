import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "secondary" | "danger";
	size?: "sm" | "md" | "lg";
}

export function Button({
	children,
	variant = "primary",
	size = "md",
	className = "",
	...props
}: ButtonProps) {
	const baseStyles = "font-medium rounded-lg transition-colors duration-200";

	const variantStyles = {
		primary: "bg-blue-500 text-white hover:bg-blue-600",
		secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
		danger: "bg-red-500 text-white hover:bg-red-600",
	};

	const sizeStyles = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2 text-base",
		lg: "px-6 py-3 text-lg",
	};

	const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

	return (
		<button className={combinedClassName} {...props}>
			{children}
		</button>
	);
}

import type { ButtonHTMLAttributes, ReactNode } from "react"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children: ReactNode
}

const V: Record<string, string> = {
  primary:   "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200",
  danger:    "bg-red-600 hover:bg-red-700 text-white border-transparent",
  warning:   "bg-amber-500 hover:bg-amber-600 text-white border-transparent",
  ghost:     "bg-transparent hover:bg-gray-100 text-gray-600 border-transparent",
  success:   "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent",
}

const S: Record<string, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2 rounded-xl",
  lg: "text-base px-6 py-3 rounded-xl",
}

export function Button({
  type = "button",
  variant = "primary",
  size = "md",
  loading,
  children,
  className = "",
  disabled,
  onClick,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium border transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${V[variant]} ${S[size]} ${className}`}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}

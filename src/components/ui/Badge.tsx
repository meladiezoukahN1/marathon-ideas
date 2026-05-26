interface Props {
  label: string
  variant?: "info" | "success" | "warning" | "danger" | "neutral" | "purple"
  size?: "sm" | "md"
}
const V: Record<string, string> = {
  info:    "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger:  "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  purple:  "bg-purple-100 text-purple-800 border-purple-200",
}
export function Badge({ label, variant = "neutral", size = "sm" }: Props) {
  const sz = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sz} ${V[variant]}`}>
      {label}
    </span>
  )
}

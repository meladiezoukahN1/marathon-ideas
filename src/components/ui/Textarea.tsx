import type { TextareaHTMLAttributes } from "react"

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export function Textarea({ label, error, className = "", ...rest }: Props) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        {...rest}
        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-gray-900
          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
          resize-none disabled:bg-gray-50
          ${error ? "border-red-400" : "border-gray-300"}
          ${className}`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

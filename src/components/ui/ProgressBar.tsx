"use client"
import { motion } from "framer-motion"
import { SPRING_SLOW } from "@/lib/animation"

interface Props {
  value: number
  color?: "emerald" | "blue" | "amber"
  label?: string
  showValue?: boolean
  height?: "sm" | "md" | "lg"
}
const COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
}
const HEIGHTS: Record<string, string> = { sm: "h-2", md: "h-3", lg: "h-4" }

export function ProgressBar({ value, color = "emerald", label, showValue = true, height = "md" }: Props) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label    && <span className="text-sm text-gray-600 font-medium">{label}</span>}
          {showValue && <span className="text-sm font-bold text-gray-800">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${HEIGHTS[height]}`}>
        <motion.div
          className={`${HEIGHTS[height]} rounded-full ${COLORS[color]}`}
          animate={{ width: `${clamped}%` }}
          transition={SPRING_SLOW}
        />
      </div>
    </div>
  )
}

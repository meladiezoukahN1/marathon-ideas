import React from "react"

interface TeamAvatarProps {
  name: string
  imageUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const SIZE_MAP = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 md:w-24 md:h-24 text-xl md:text-2xl",
  xl: "w-24 h-24 md:w-32 md:h-32 text-3xl md:text-4xl",
}

export function TeamAvatar({ name, imageUrl, size = "md", className = "" }: TeamAvatarProps) {
  const sizeClass = SIZE_MAP[size]

  if (imageUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass}  flex items-center justify-center font-black text-white ${className}`}
    >
      {name.charAt(0)}
    </div>
  )
}

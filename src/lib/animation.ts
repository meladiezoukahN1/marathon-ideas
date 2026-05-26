import type { Transition, Variants } from "framer-motion"

export const SPRING_DEFAULT: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 28,
}

export const SPRING_SLOW: Transition = {
  type: "spring",
  stiffness: 80,
  damping: 20,
}

export const FADE_UP: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: -16, transition: { duration: 0.25, ease: "easeIn" } },
}

export const SCALE_IN: Variants = {
  hidden:  { scale: 0.92, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.35 } },
}

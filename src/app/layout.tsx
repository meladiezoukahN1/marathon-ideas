import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import { Providers } from "@/components/shared/Providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "ماراثون الأفكار",
  description: "نظام التصويت التفاعلي للمسابقات الريادية",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        </Providers>
      </body>
    </html>
  )
}

import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import { Providers } from "@/components/shared/Providers"
import "./globals.css"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://marathon-ideas.vercel.app"

const ogImageUrl = `${siteUrl}/og-marathon-v2.jpg`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "ماراثون الأفكار",
    template: "%s | ماراثون الأفكار",
  },

  description:
    "تابع التحديات، صوّت للفريق الأفضل، وشاهد النتائج مباشرة في ماراثون الأفكار.",

  applicationName: "ماراثون الأفكار",

  keywords: [
    "ماراثون الأفكار",
    "تصويت",
    "تحديات",
    "فرق",
    "ابتكار",
    "ريادة أعمال",
    "مسابقة",
  ],

  authors: [
    {
      name: "ماراثون الأفكار",
    },
  ],

  creator: "ماراثون الأفكار",
  publisher: "ماراثون الأفكار",

  icons: {
    icon: "/SVG/gradient_color_logo-black_bg.svg",
    shortcut: "/SVG/gradient_color_logo-black_bg.svg",
    apple: "/SVG/gradient_color_logo-black_bg.svg",
  },

  alternates: {
    canonical: siteUrl,
  },

  openGraph: {
    type: "website",
    locale: "ar_LY",
    url: siteUrl,
    siteName: "ماراثون الأفكار",
    title: "ماراثون الأفكار",
    description:
      "تابع التحديات، صوّت للفريق الأفضل، وشاهد النتائج مباشرة في ماراثون الأفكار.",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "ماراثون الأفكار - منصة التصويت والتحديات",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ماراثون الأفكار",
    description:
      "تابع التحديات، صوّت للفريق الأفضل، وشاهد النتائج مباشرة في ماراثون الأفكار.",
    images: [ogImageUrl, "/og-marathon-v2.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                direction: "rtl",
                background: "#020617",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.15)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
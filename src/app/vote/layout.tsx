import type { Metadata } from "next"

export const dynamic = "force-dynamic"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://marathon-ideas.vercel.app"

const ogImageUrl = `${siteUrl}/og-marathon.png`

export const metadata: Metadata = {
  title: "التصويت",
  description: "شارك في التصويت واختر الفريق الأفضل في ماراثون الأفكار.",
  alternates: {
    canonical: `${siteUrl}/vote`,
  },
  openGraph: {
    type: "website",
    locale: "ar_LY",
    url: `${siteUrl}/vote`,
    siteName: "ماراثون الأفكار",
    title: "التصويت | ماراثون الأفكار",
    description: "شارك في التصويت واختر الفريق الأفضل في التحدي الحالي.",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "التصويت في ماراثون الأفكار",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "التصويت | ماراثون الأفكار",
    description: "شارك في التصويت واختر الفريق الأفضل في التحدي الحالي.",
    images: [ogImageUrl],
  },
}

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
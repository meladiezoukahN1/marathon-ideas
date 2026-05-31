import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ماراثون الأفكار - العرض",
  description: "عرض النتائج والتحديات في ماراثون الأفكار",
}

export const dynamic = "force-dynamic"

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

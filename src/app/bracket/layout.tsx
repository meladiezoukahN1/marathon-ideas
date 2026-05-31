import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ماراثون الأفكار - عرض النتائج",
  description: "عرض نتائج الفرق والتحديات في ماراثون الأفكار",
}

export const dynamic = "force-dynamic"


export default function BracketLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

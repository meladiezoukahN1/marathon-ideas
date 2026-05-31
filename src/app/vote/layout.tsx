import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ماراثون الأفكار - التصويت",
  description: "صفحة التصويت للماراثون",
}

export const dynamic = "force-dynamic"

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

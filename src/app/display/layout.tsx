import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ماراثون الأفكار - العرض",
  description: "عرض النتائج والتحديات في ماراثون الأفكار",
};

export const dynamic = "force-dynamic";

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('BACKGROUND-01.png')",
      }}
    >
      {children}
    </div>
  );
}
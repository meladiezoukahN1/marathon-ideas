import { Suspense } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PublicShell } from "@/components/layout/public-shell";
import { DisplayScreen } from "@/features/display/components/display-screen";
import { getDisplayData } from "@/features/display/lib/display-data";

async function DisplayPageContent() {
  const result = await getDisplayData();

  if (result.status === "missing_app_url") {
    return <ErrorState title="إعدادات غير مكتملة" description="NEXT_PUBLIC_APP_URL غير مضبوط لعرض بيانات الحدث." />;
  }

  if (result.status === "error") {
    return <ErrorState description={result.message} />;
  }

  if (result.status === "empty") {
    return <EmptyState title="لا توجد جولات نشطة" description={result.message} />;
  }

  return <DisplayScreen view={result.view} />;
}

export default function DisplayPage() {
  return (
    <PublicShell>
      <Suspense fallback={<LoadingState label="جاري تحميل شاشة العرض" />}>
        <DisplayPageContent />
      </Suspense>
    </PublicShell>
  );
}

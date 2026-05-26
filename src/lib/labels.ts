export function getTimerStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "READY":
      return "جاهز"
    case "RUNNING":
      return "قيد العرض"
    case "PAUSED":
      return "متوقف مؤقتاً"
    case "FINISHED":
      return "انتهى العرض"
    default:
      return status ?? ""
  }
}

export function getChallengePhaseLabel(phase: string | null | undefined): string {
  switch (phase) {
    case "WAITING":
      return "انتظار"
    case "PRESENTING":
      return "عرض المشاريع"
    case "VOTING":
      return "التصويت"
    case "RESULT":
      return "النتيجة"
    case "FINISHED":
      return "منتهي"
    default:
      return phase ?? ""
  }
}

export function getChallengeStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "PENDING":
      return "قيد الانتظار"
    case "ACTIVE":
      return "نشط"
    case "COMPLETED":
      return "مكتمل"
    default:
      return status ?? ""
  }
}

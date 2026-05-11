export function teacherName(t: {
  firstName: string
  lastName: string
  displayName?: string | null
}): string {
  return t.displayName ?? `${t.firstName} ${t.lastName}`
}

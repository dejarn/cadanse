export function slugify(name: string, seasonLabel: string): string {
  const raw = `${name}-${seasonLabel}`
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

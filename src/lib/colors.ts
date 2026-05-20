// Palette readable on dark background (#0F0E0D / #1A1917)
export const DOT_COLORS = [
  "#D4A853", // gold (accent)
  "#5B9BD5", // blue
  "#6AAB8E", // green
  "#D97A9B", // pink
  "#E8924A", // orange
  "#9B7FD4", // purple
  "#4DBFC4", // teal
  "#C45C5C", // red
  "#8DB86C", // lime
  "#B08556", // brown
] as const

export function dotColor(index: number): string {
  return DOT_COLORS[index % DOT_COLORS.length]
}

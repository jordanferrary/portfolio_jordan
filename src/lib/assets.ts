export function assetPath(filename: string): string {
  return `${import.meta.env.BASE_URL}images/${filename}`
}

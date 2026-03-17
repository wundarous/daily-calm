export function titleToSlug(title) {
  return title
    .replace(/^Daily Calm\s*[–—-]\s*/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildFilename(date, title) {
  const slug = titleToSlug(title)
  return `${date}_daily-calm_${slug}.webm`
}

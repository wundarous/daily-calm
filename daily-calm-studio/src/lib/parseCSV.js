import Papa from 'papaparse'

export async function fetchAndParseCSV(month) {
  const url = `/content/${month}.csv`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`)
  const text = await res.text()
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  })
  if (result.errors.length > 0) {
    console.warn('CSV parse warnings:', result.errors)
  }
  return result.data
}

import { useState, useEffect } from 'react'
import { saveFolderHandle } from '../lib/folderStore'

function formatMonthLabel(filename) {
  // "2026-04.csv" -> "April 2026"
  const [year, month] = filename.replace('.csv', '').split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function FirstRun({ onComplete }) {
  const [availableMonths, setAvailableMonths] = useState([])
  const [manifestError, setManifestError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null) // e.g. "2026-04"
  const [folderHandle, setFolderHandle] = useState(null)
  const [folderError, setFolderError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/content/index.json')
      .then(r => {
        if (!r.ok) throw new Error(`index.json not found (${r.status})`)
        return r.json()
      })
      .then(files => {
        setAvailableMonths(files)
        setLoading(false)
      })
      .catch(err => {
        setManifestError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (selectedMonth && folderHandle) {
      localStorage.setItem('dc_active_month', selectedMonth)
      saveFolderHandle(folderHandle).then(() => {
        onComplete({ month: selectedMonth, folderHandle })
      })
    }
  }, [selectedMonth, folderHandle, onComplete])

  async function handlePickFolder() {
    setFolderError(null)
    if (!('showDirectoryPicker' in window)) {
      const isBrave = navigator.brave != null
      if (isBrave) {
        setFolderError('BRAVE_FLAG')
      } else {
        setFolderError('Your browser does not support folder access. Please use Chrome or Edge.')
      }
      return
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setFolderHandle(handle)
    } catch (err) {
      if (err.name === 'SecurityError') {
        setFolderError('Folder access was blocked. In Brave, check that Shields are not blocking file system access, or try Chrome/Edge.')
      } else if (err.name !== 'AbortError') {
        setFolderError('Could not open folder. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-calm-bg flex items-center justify-center p-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-stone-800 tracking-tight mb-2">
            Daily Calm Studio
          </h1>
          <p className="text-calm-muted">Let&apos;s get you set up to start recording.</p>
        </div>

        {/* Step 1 — Pick a month */}
        <div className={`bg-white rounded-2xl shadow-sm border p-8 mb-4 transition-all ${
          selectedMonth ? 'border-green-200 opacity-70' : 'border-stone-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
              selectedMonth
                ? 'bg-green-100 text-green-700'
                : 'bg-calm-accent text-white'
            }`}>
              {selectedMonth ? '✓' : '1'}
            </span>
            <h2 className="text-lg font-semibold text-stone-800">Choose a month</h2>
          </div>

          {loading && (
            <p className="text-calm-muted text-sm">Loading available months…</p>
          )}

          {manifestError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              <strong>Could not load months:</strong> {manifestError}
              <br />
              <span className="text-red-500 mt-1 block">
                Check that <code className="bg-red-100 px-1 rounded">public/content/index.json</code> exists.
              </span>
            </div>
          )}

          {!loading && !manifestError && (
            <div className="flex flex-wrap gap-3">
              {availableMonths.map(filename => {
                const monthKey = filename.replace('.csv', '')
                const label = formatMonthLabel(filename)
                const isSelected = selectedMonth === monthKey
                return (
                  <button
                    key={filename}
                    onClick={() => setSelectedMonth(monthKey)}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                      isSelected
                        ? 'bg-calm-accent text-white border-calm-accent shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-calm-accent hover:text-calm-accent'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Step 2 — Choose output folder */}
        <div className={`bg-white rounded-2xl shadow-sm border p-8 transition-all ${
          folderHandle ? 'border-green-200 opacity-70' : 'border-stone-200'
        } ${!selectedMonth ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
              folderHandle
                ? 'bg-green-100 text-green-700'
                : 'bg-calm-accent text-white'
            }`}>
              {folderHandle ? '✓' : '2'}
            </span>
            <h2 className="text-lg font-semibold text-stone-800">Choose output folder</h2>
          </div>

          <p className="text-calm-muted text-sm mb-5 leading-relaxed">
            Pick the folder where your recorded <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">.webm</code> files will be saved.
            The app will check this folder to track which videos are done.
          </p>

          {folderHandle ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium truncate">
                {folderHandle.name}
              </div>
              <button
                onClick={handlePickFolder}
                className="text-sm text-calm-muted hover:text-stone-700 underline underline-offset-2"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={handlePickFolder}
              disabled={!selectedMonth}
              className="w-full py-3 rounded-xl font-medium text-sm bg-calm-accent text-white hover:bg-purple-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Choose Output Folder
            </button>
          )}

          {folderError && folderError === 'BRAVE_FLAG' ? (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 leading-relaxed">
              <strong>Brave has this feature disabled by default.</strong>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Open a new tab and go to <code className="bg-amber-100 px-1 rounded">brave://flags/#file-system-access-api</code></li>
                <li>Set it to <strong>Enabled</strong></li>
                <li>Click <strong>Relaunch</strong> and come back here</li>
              </ol>
              <p className="mt-2 text-amber-700">Or just use Chrome — it works out of the box.</p>
            </div>
          ) : folderError ? (
            <p className="mt-3 text-sm text-red-600">{folderError}</p>
          ) : null}
        </div>

        {/* Waiting state hint */}
        {selectedMonth && !folderHandle && (
          <p className="text-center text-calm-muted text-sm mt-5">
            Almost there — just choose where to save your recordings.
          </p>
        )}

      </div>
    </div>
  )
}

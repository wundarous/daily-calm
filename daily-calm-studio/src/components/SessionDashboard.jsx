import { useState, useEffect, useRef } from 'react'
import VideoRow from './VideoRow'
import { fetchAndParseCSV } from '../lib/parseCSV'
import { scanFolder } from '../lib/filesystem'
import { buildFilename } from '../lib/slugify'
import { saveFolderHandle } from '../lib/folderStore'

function formatMonthLabel(month) {
  const [year, m] = month.split('-')
  return new Date(Number(year), Number(m) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function SessionDashboard({
  month,
  folderHandle: initialHandle,
  onSwitchMonth,
  onRecord,
}) {
  const [videos, setVideos] = useState([])
  const [csvError, setCsvError] = useState(null)
  const [folderHandle, setFolderHandle] = useState(initialHandle)
  const [doneSet, setDoneSet] = useState(null) // null = unknown, Set = scanned
  const [scanning, setScanning] = useState(false)
  const [folderError, setFolderError] = useState(null)
  const nextUpRef = useRef(null)

  // Load CSV
  useEffect(() => {
    fetchAndParseCSV(month)
      .then(setVideos)
      .catch(err => setCsvError(err.message))
  }, [month])

  // Scan folder whenever handle or videos change
  useEffect(() => {
    if (!folderHandle || videos.length === 0) return
    scanDone(folderHandle)
  }, [folderHandle, videos])

  // Auto-scroll to next-up row once we know done status
  useEffect(() => {
    if (doneSet && nextUpRef.current) {
      nextUpRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [doneSet])

  async function scanDone(handle) {
    setScanning(true)
    setFolderError(null)
    try {
      const names = await scanFolder(handle)
      const set = new Set(names)
      setDoneSet(set)
    } catch (err) {
      setFolderError('Folder permission lapsed.')
      setDoneSet(null)
    } finally {
      setScanning(false)
    }
  }

  async function handleReconnectFolder() {
    setFolderError(null)
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      await saveFolderHandle(handle)
      setFolderHandle(handle)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setFolderError('Could not open folder.')
      }
    }
  }

  async function handleChangeFolder() {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
      await saveFolderHandle(handle)
      setFolderHandle(handle)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setFolderError('Could not open folder.')
      }
    }
  }

  // Compute per-video status
  function getStatus(video) {
    if (!doneSet) return 'unknown'
    const filename = buildFilename(video.date, video.title)
    return doneSet.has(filename) ? 'done' : 'pending'
  }

  const doneCount = videos.filter(v => getStatus(v) === 'done').length
  const nextUpIndex = videos.findIndex(v => getStatus(v) !== 'done')

  return (
    <div className="min-h-screen bg-calm-bg">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-stone-800 leading-tight">
              {formatMonthLabel(month)}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-calm-muted">
                {doneSet
                  ? `${doneCount} / ${videos.length} recorded`
                  : scanning
                  ? 'Checking folder…'
                  : `${videos.length} videos`}
              </span>
              {doneSet && videos.length > 0 && (
                <div className="flex-1 max-w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-calm-accent rounded-full transition-all"
                    style={{ width: `${(doneCount / videos.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {folderError ? (
              <button
                onClick={handleReconnectFolder}
                className="text-sm px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 font-medium"
              >
                Reconnect Folder
              </button>
            ) : (
              <button
                onClick={handleChangeFolder}
                className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:border-calm-accent hover:text-calm-accent"
              >
                Change Folder
              </button>
            )}
            <button
              onClick={onSwitchMonth}
              className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:border-calm-accent hover:text-calm-accent"
            >
              Switch Month
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto">

        {/* Folder error banner */}
        {folderError && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            {folderError} Done status is unavailable until reconnected.
          </div>
        )}

        {/* CSV error */}
        {csvError && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Could not load video list:</strong> {csvError}
            <br />
            <span className="text-red-500">Check that <code className="bg-red-100 px-1 rounded">public/content/{month}.csv</code> exists and is listed in <code className="bg-red-100 px-1 rounded">index.json</code>.</span>
          </div>
        )}

        {/* Video list */}
        {videos.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden mt-5 mx-5 mb-8">
            {videos.map((video, i) => {
              const status = getStatus(video)
              const isNextUp = i === nextUpIndex
              return (
                <div key={video.date} ref={isNextUp ? nextUpRef : null}>
                  <VideoRow
                    video={video}
                    status={status}
                    isNextUp={isNextUp}
                    onRecord={v => onRecord(v, videos)}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state while loading */}
        {videos.length === 0 && !csvError && (
          <div className="flex items-center justify-center py-20 text-calm-muted text-sm">
            Loading videos…
          </div>
        )}
      </div>
    </div>
  )
}

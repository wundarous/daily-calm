import { useState, useEffect } from 'react'
import MetadataPanel from './MetadataPanel'
import CameraPanel from './CameraPanel'
import { scanFolder } from '../lib/filesystem'
import { buildFilename } from '../lib/slugify'

export default function RecordingStudio({ initialVideo, videos, folderHandle, onBack }) {
  const [activeVideo, setActiveVideo] = useState(initialVideo)
  const [doneSet, setDoneSet] = useState(new Set())
  const [sessionDoneCount, setSessionDoneCount] = useState(0)

  // Scan folder on mount to know what's already done
  useEffect(() => {
    scanFolder(folderHandle)
      .then(names => setDoneSet(new Set(names)))
      .catch(() => {}) // non-fatal — just means auto-advance won't skip already-done videos
  }, [])

  function handleSaved() {
    // Update done set locally so auto-advance skips this video
    const filename = buildFilename(activeVideo.date, activeVideo.title)
    const updated = new Set(doneSet)
    updated.add(filename)
    setDoneSet(updated)
    setSessionDoneCount(c => c + 1)

    // Advance to the next unrecorded video, or return to dashboard if all done
    const next = videos.find(v => !updated.has(buildFilename(v.date, v.title)))
    if (next) {
      setActiveVideo(next)
    } else {
      onBack()
    }
  }

  const videoIndex = videos.findIndex(v => v.date === activeVideo.date)

  return (
    <div className="fixed inset-0 flex" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Left column — metadata */}
      <div className="w-72 flex-shrink-0 border-r border-stone-800 overflow-y-auto">
        <MetadataPanel
          video={activeVideo}
          videoIndex={videoIndex}
          totalVideos={videos.length}
          sessionDoneCount={sessionDoneCount}
          onBack={onBack}
        />
      </div>

      {/* Right column — camera */}
      <div className="flex-1 min-w-0">
        {/* key forces full remount (fresh camera) on video advance */}
        <CameraPanel
          key={activeVideo.date}
          video={activeVideo}
          folderHandle={folderHandle}
          onSaved={handleSaved}
        />
      </div>
    </div>
  )
}

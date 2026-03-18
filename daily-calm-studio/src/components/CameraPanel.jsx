import { useState, useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import { buildFilename } from '../lib/slugify'

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function CameraPanel({ video, folderHandle, onSaved }) {
  const [recordingState, setRecordingState] = useState('idle')
  const [countdown, setCountdown]           = useState(3)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [previewUrl, setPreviewUrl]         = useState(null)
  const [chunks, setChunks]                 = useState([])
  const [permissionDenied, setPermissionDenied] = useState(false)

  const webcamRef        = useRef(null)
  const mediaRecorderRef = useRef(null)
  const elapsedTimerRef  = useRef(null)

  const shortTitle = video.title.replace(/^Daily Calm\s*[–—-]\s*/i, '')

  // ── Assemble blob once all chunks are in and recorder is inactive ──────────
  useEffect(() => {
    if (chunks.length === 0) return
    if (mediaRecorderRef.current?.state !== 'inactive') return
    const mimeType = mediaRecorderRef.current.mimeType || 'video/webm'
    const blob = new Blob(chunks, { type: mimeType })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setRecordingState('stopped')
  }, [chunks])

  // ── Spacebar shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code !== 'Space') return
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      e.preventDefault()
      if (recordingState === 'idle')      handleStartClick()
      if (recordingState === 'recording') stopRecording()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [recordingState])

  // ── Countdown → start recording ────────────────────────────────────────────
  const handleStartClick = () => {
    setCountdown(3)
    setRecordingState('countdown')
    let count = 3
    const interval = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) {
        clearInterval(interval)
        startRecording()
        setRecordingState('recording')
      }
    }, 1000)
  }

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = () => {
    setChunks([])
    const stream = webcamRef.current.stream
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : 'video/webm'

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setChunks(prev => [...prev, e.data])
      }
    }

    mediaRecorderRef.current.start()
    setElapsedSeconds(0)
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
  }

  // ── Stop recording ─────────────────────────────────────────────────────────
  const stopRecording = () => {
    clearInterval(elapsedTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  // ── Re-record ──────────────────────────────────────────────────────────────
  const handleReRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setChunks([])
    setRecordingState('idle')
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!previewUrl || !folderHandle) return
    setRecordingState('saving')
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const filename = buildFilename(video.date, video.title)
      const fileHandle = await folderHandle.getFileHandle(filename, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setRecordingState('saved')
      setTimeout(() => onSaved(), 1500)
    } catch (err) {
      console.error('Save failed:', err)
      setRecordingState('stopped')
    }
  }

  // ── Permission denied ──────────────────────────────────────────────────────
  if (permissionDenied) {
    return (
      <div className="flex flex-col h-full p-6 items-center justify-center text-center">
        <p className="text-stone-400 text-sm mb-2">Camera or microphone access was denied.</p>
        <p className="text-stone-500 text-xs mb-5">Allow access in your browser settings and reload the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-stone-700 text-white text-sm hover:bg-stone-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const showWebcam = recordingState !== 'stopped' && recordingState !== 'saving' && recordingState !== 'saved'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-6">

      {/* ── Video area ── */}
      <div className="relative flex-1 min-h-0 bg-black rounded-2xl overflow-hidden mb-5">

        {/* Live webcam preview */}
        {showWebcam && (
          <Webcam
            ref={webcamRef}
            audio={true}
            muted={true}
            playsInline
            videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
            onUserMediaError={() => setPermissionDenied(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Playback preview */}
        {recordingState === 'stopped' && previewUrl && (
          <video
            src={previewUrl}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Notes overlay — live states only */}
        {showWebcam && (
          <div
            className="absolute bottom-0 inset-x-0 px-5 py-4 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
          >
            <div className="text-white font-semibold text-base leading-snug">{shortTitle}</div>
            <div className="text-stone-300 text-sm mt-0.5">
              {video.technique} · {video.technique_category}
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {recordingState === 'countdown' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8rem', fontWeight: 'bold', color: 'white',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}>
            {countdown}
          </div>
        )}

        {/* Recording indicator */}
        {recordingState === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-3 h-10">

          {recordingState === 'idle' && (
            <button
              onClick={handleStartClick}
              className="px-6 py-2.5 rounded-xl bg-calm-accent text-white font-medium hover:bg-purple-600 transition-colors"
            >
              ▶ Start Recording
            </button>
          )}

          {recordingState === 'countdown' && (
            <span className="text-stone-500 text-sm">Get ready…</span>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              ⏹ Stop
            </button>
          )}

          {recordingState === 'stopped' && (
            <>
              <button
                onClick={handleReRecord}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-sm hover:border-stone-500 hover:text-white transition-colors"
              >
                ↺ Re-record
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-calm-accent text-white font-medium text-sm hover:bg-purple-600 transition-colors"
              >
                💾 Save
              </button>
            </>
          )}

          {recordingState === 'saving' && (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </div>
          )}

          {recordingState === 'saved' && (
            <div className="text-green-400 text-sm font-medium">
              ✓ Saved as {buildFilename(video.date, video.title)}
            </div>
          )}
        </div>

        {(recordingState === 'idle' || recordingState === 'recording') && (
          <p className="text-stone-700 text-xs">
            Space to {recordingState === 'idle' ? 'start' : 'stop'}
          </p>
        )}
      </div>
    </div>
  )
}

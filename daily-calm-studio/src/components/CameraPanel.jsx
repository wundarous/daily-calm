import { useState, useEffect, useRef } from 'react'
import { saveRecording } from '../lib/filesystem'
import { buildFilename } from '../lib/slugify'

function pickMimeType() {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

// State machine:
//   requesting → idle → countdown → recording → stopped → saving → saved
//   requesting → denied
//   stopped → idle  (re-record)

export default function CameraPanel({ video, folderHandle, onSaved }) {
  const [cameraState, setCameraState] = useState('requesting')
  const [countdown, setCountdown]     = useState(3)
  const [elapsed, setElapsed]         = useState(0)
  const [savedFilename, setSavedFilename] = useState(null)
  const [saveError, setSaveError]     = useState(null)

  // Mirror of cameraState readable synchronously (avoids stale closure in key handler)
  const stateRef     = useRef('requesting')
  const liveRef      = useRef(null)
  const playbackRef  = useRef(null)
  const streamRef    = useRef(null)
  const recorderRef  = useRef(null)
  const chunksRef    = useRef([])
  const blobRef      = useRef(null)
  const timerRef     = useRef(null)
  const countdownRef = useRef(null)

  function setState(s) {
    stateRef.current = s
    setCameraState(s)
  }

  // Start camera once on mount
  useEffect(() => {
    startCamera()
    return stopCamera
  }, [])

  // Space bar — read stateRef directly, never inside a setState updater
  useEffect(() => {
    function onKey(e) {
      if (e.code !== 'Space') return
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return
      e.preventDefault()
      const s = stateRef.current
      if (s === 'idle') startCountdown()
      else if (s === 'recording') stopRecording()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function startCamera() {
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (liveRef.current) liveRef.current.srcObject = stream
      setState('idle')
    } catch {
      setState('denied')
    }
  }

  function stopCamera() {
    clearInterval(timerRef.current)
    clearInterval(countdownRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function startCountdown() {
    // Guard: only start from idle
    if (stateRef.current !== 'idle') return
    setState('countdown')
    setCountdown(3)
    let count = 3
    countdownRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(countdownRef.current)
        startRecording()
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  function startRecording() {
    chunksRef.current = []
    blobRef.current = null
    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {})
    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      blobRef.current = blob
      if (playbackRef.current) {
        if (playbackRef.current.src) URL.revokeObjectURL(playbackRef.current.src)
        playbackRef.current.src = URL.createObjectURL(blob)
      }
      setState('stopped')
    }
    recorder.start()
    recorderRef.current = recorder
    setElapsed(0)
    setState('recording')
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }

  function stopRecording() {
    // Guard: only stop an actively recording recorder
    if (recorderRef.current?.state !== 'recording') return
    clearInterval(timerRef.current)
    recorderRef.current.stop()
  }

  function reRecord() {
    blobRef.current = null
    setSaveError(null)
    setElapsed(0)
    setState('idle')
  }

  async function handleSave() {
    if (!blobRef.current || !folderHandle) return
    const filename = buildFilename(video.date, video.title)
    setSaveError(null)
    setState('saving')
    try {
      await saveRecording(folderHandle, filename, blobRef.current)
      setSavedFilename(filename)
      setState('saved')
      setTimeout(() => onSaved(), 1500)
    } catch {
      setSaveError('Save failed. Check folder permissions and try again.')
      setState('stopped')
    }
  }

  const showLive = !['stopped', 'saving', 'saved'].includes(cameraState)

  // Strip "Daily Calm – " prefix for the compact overlay label
  const shortTitle = video.title.replace(/^Daily Calm\s*[–—-]\s*/i, '')

  return (
    <div className="flex flex-col h-full p-6">

      {/* Preview area */}
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-5 min-h-0">

        {/* Live feed */}
        <video
          ref={liveRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${showLive ? '' : 'hidden'}`}
        />

        {/* Playback after stop */}
        <video
          ref={playbackRef}
          controls
          playsInline
          className={`w-full h-full object-cover ${!showLive ? '' : 'hidden'}`}
        />

        {/* Notes overlay — visible during live feed only, not during playback */}
        {showLive && cameraState !== 'requesting' && cameraState !== 'denied' && (
          <div className="absolute bottom-0 inset-x-0 px-5 py-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)' }}
          >
            <div className="text-white font-semibold text-base leading-snug">{shortTitle}</div>
            <div className="text-stone-300 text-sm mt-0.5">{video.technique} · {video.technique_category}</div>
          </div>
        )}

        {/* Countdown overlay */}
        {cameraState === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
            <span className="text-white font-bold select-none" style={{ fontSize: '10rem', lineHeight: 1 }}>
              {countdown}
            </span>
          </div>
        )}

        {/* Recording dot + timer */}
        {cameraState === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-mono">{formatTime(elapsed)}</span>
          </div>
        )}

        {/* Denied */}
        {cameraState === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <p className="text-stone-400 mb-2 text-sm">Camera or microphone access was denied.</p>
            <p className="text-stone-600 text-xs mb-5">Check your browser permissions and try again.</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-lg bg-stone-700 text-white text-sm hover:bg-stone-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Requesting */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-stone-500 text-sm">Starting camera…</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-3 h-10">

          {cameraState === 'idle' && (
            <button
              onClick={startCountdown}
              className="px-6 py-2.5 rounded-xl bg-calm-accent text-white font-medium hover:bg-purple-600 transition-colors"
            >
              ▶ Start Recording
            </button>
          )}

          {cameraState === 'countdown' && (
            <span className="text-stone-500 text-sm">Get ready…</span>
          )}

          {cameraState === 'recording' && (
            <button
              onClick={stopRecording}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              ⏹ Stop
            </button>
          )}

          {cameraState === 'stopped' && (
            <>
              <button
                onClick={reRecord}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-sm hover:border-stone-500 hover:text-white transition-colors"
              >
                ↺ Re-record
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-calm-accent text-white font-medium text-sm hover:bg-purple-600 transition-colors"
              >
                Save
              </button>
            </>
          )}

          {cameraState === 'saving' && (
            <div className="flex items-center gap-2 text-stone-400 text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </div>
          )}

          {cameraState === 'saved' && (
            <div className="text-green-400 text-sm font-medium">
              ✓ Saved as {savedFilename}
            </div>
          )}
        </div>

        {saveError && (
          <p className="text-red-400 text-xs text-center">{saveError}</p>
        )}

        {(cameraState === 'idle' || cameraState === 'recording') && (
          <p className="text-stone-700 text-xs">
            Space to {cameraState === 'idle' ? 'start' : 'stop'}
          </p>
        )}
      </div>
    </div>
  )
}

# Task: Rebuild the video recorder component from scratch

The current recorder implementation is broken. Delete the existing recorder
code entirely and rebuild it from scratch using the exact specification below.
Do not salvage any existing recorder code.

---

## The component to rebuild

File: `src/components/CameraPanel.jsx`

This component handles:
- Showing a live webcam preview while the user is idle or recording
- Recording video + audio from the webcam
- Letting the user preview the recording after stopping
- Saving the final .webm file via the File System Access API

---

## Complete implementation spec

### Step 1 — Get the stream (once, on mount)

On component mount, call getUserMedia ONCE and store the stream in a ref:

```js
const streamRef = useRef(null)

useEffect(() => {
  let active = true
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      if (!active) return
      streamRef.current = stream
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream
      }
    })
    .catch(err => {
      // set a permissionDenied state to show an error message
    })
  return () => {
    active = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }
}, [])
```

### Step 2 — Live preview video element

Use a dedicated ref for the live preview video element:

```js
const liveVideoRef = useRef(null)
```

The JSX element must have these exact attributes — no exceptions:

```jsx
<video
  ref={liveVideoRef}
  autoPlay
  muted
  playsInline
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
/>
```

- `autoPlay` so it starts immediately when srcObject is set
- `muted` so there is no audio feedback loop from the live mic
- `playsInline` for compatibility
- Never set `src` on this element — only `srcObject`

### Step 3 — Recording state machine

Use a single `recordingState` string in useState:

```js
const [recordingState, setRecordingState] = useState('idle')
// values: 'idle' | 'countdown' | 'recording' | 'stopped' | 'saving' | 'saved'
```

Also track:
```js
const [countdown, setCountdown] = useState(3)
const [elapsedSeconds, setElapsedSeconds] = useState(0)
const [previewUrl, setPreviewUrl] = useState(null)
const chunksRef = useRef([])
const recorderRef = useRef(null)
const elapsedTimerRef = useRef(null)
```

### Step 4 — Start recording (with countdown)

When the user clicks Start:

```js
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
    }
  }, 1000)
}
```

### Step 5 — startRecording()

```js
const startRecording = () => {
  if (!streamRef.current) return

  chunksRef.current = []

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
    ? 'video/webm;codecs=vp8,opus'
    : 'video/webm'

  const recorder = new MediaRecorder(streamRef.current, { mimeType })
  recorderRef.current = recorder

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunksRef.current.push(e.data)
    }
  }

  recorder.onstop = () => {
    const blob = new Blob(chunksRef.current, { type: mimeType })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setRecordingState('stopped')
  }

  // NO timeslice argument — collect all data at once on stop
  recorder.start()

  setElapsedSeconds(0)
  setRecordingState('recording')

  elapsedTimerRef.current = setInterval(() => {
    setElapsedSeconds(s => s + 1)
  }, 1000)
}
```

### Step 6 — Stop recording

```js
const handleStop = () => {
  clearInterval(elapsedTimerRef.current)
  if (recorderRef.current && recorderRef.current.state === 'recording') {
    recorderRef.current.stop()
    // recordingState will be set to 'stopped' inside recorder.onstop
  }
}
```

### Step 7 — Playback preview after recording

Use a SEPARATE video element for playback — never reuse the live preview element.
Show this element only when recordingState === 'stopped':

```jsx
{recordingState === 'stopped' && previewUrl && (
  <video
    src={previewUrl}
    controls
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
)}
```

When switching from 'stopped' back to live preview (re-record), revoke the
old object URL and clear it:

```js
const handleReRecord = () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  setPreviewUrl(null)
  chunksRef.current = []
  setRecordingState('idle')
}
```

### Step 8 — Save recording

```js
const handleSave = async () => {
  if (!previewUrl || !dirHandle) return
  setRecordingState('saving')

  try {
    const response = await fetch(previewUrl)
    const blob = await response.blob()
    const filename = buildFilename(video) // use existing slugify/filename logic
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()

    URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordingState('saved')

    // auto-advance after 1.5s
    setTimeout(() => {
      onSaved() // callback to parent to advance to next video
    }, 1500)
  } catch (err) {
    console.error('Save failed:', err)
    setRecordingState('stopped') // go back so user can retry
  }
}
```

### Step 9 — UI per recording state

```
idle      → show live preview + "▶ Start Recording" button
countdown → show live preview + large countdown number centered on top of video
recording → show live preview + "⏹ Stop" button + red pulsing dot + MM:SS timer
stopped   → show playback preview (with controls) + "▶ Preview" already handled
            by native controls + "💾 Save" button + "↺ Re-record" button
saving    → show spinner + "Saving…"
saved     → show "✓ Saved: [filename]" message
```

The countdown overlay should be absolutely positioned over the video:

```jsx
{recordingState === 'countdown' && (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '8rem', fontWeight: 'bold', color: 'white',
    backgroundColor: 'rgba(0,0,0,0.4)'
  }}>
    {countdown}
  </div>
)}
```

### Step 10 — Elapsed timer display format

```js
const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}
```

### Step 11 — Spacebar shortcut

```js
useEffect(() => {
  const handleKey = (e) => {
    if (e.code !== 'Space') return
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
    e.preventDefault()
    if (recordingState === 'idle') handleStartClick()
    if (recordingState === 'recording') handleStop()
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [recordingState])
```

### Step 12 — Permission denied state

If getUserMedia throws, show this instead of the video element:

```jsx
<div>
  <p>Camera or microphone access was denied.</p>
  <p>Please allow access in your browser settings and reload the page.</p>
  <button onClick={() => window.location.reload()}>Retry</button>
</div>
```

---

## What NOT to do

- Do not call getUserMedia more than once
- Do not use a timeslice in recorder.start()
- Do not set `src` on the live preview video element
- Do not share the live preview element with the playback preview
- Do not use `video/mp4` — use webm only
- Do not try to record from a canvas element
- Do not use any third-party recording libraries

---

## When done

Verify the following manually:
1. Live preview appears immediately on page load
2. Clicking Start shows a 3-second countdown, then recording begins
3. Stopping records cleanly and playback preview shows the recording
4. Audio and video are in sync in the playback preview
5. Save writes the file to the output folder with the correct filename

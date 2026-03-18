# Rebuild CameraPanel using react-webcam

Delete CameraPanel.jsx entirely and rewrite it from scratch using the
react-webcam library. Do not keep any of the existing recorder code.

## Install the library

```bash
npm install react-webcam
```

## How react-webcam works

react-webcam handles all getUserMedia, stream management, and cleanup
internally. You just render the component and use its ref methods.

```jsx
import Webcam from 'react-webcam'

const webcamRef = useRef(null)

<Webcam
  ref={webcamRef}
  audio={true}
  muted={true}
  videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
/>
```

## Recording with react-webcam

react-webcam has a built-in `getMediaStream()` method. Pass it to
MediaRecorder like this:

```js
const mediaRecorderRef = useRef(null)
const [chunks, setChunks] = useState([])

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
}

const stopRecording = () => {
  mediaRecorderRef.current.stop()
}
```

Then assemble the blob when chunks are ready:

```js
useEffect(() => {
  if (chunks.length === 0) return
  if (mediaRecorderRef.current?.state !== 'inactive') return
  const blob = new Blob(chunks, { type: 'video/webm' })
  const url = URL.createObjectURL(blob)
  setPreviewUrl(url)
  setRecordingState('stopped')
}, [chunks])
```

## Recording state machine

Use a single recordingState string:
'idle' | 'countdown' | 'recording' | 'stopped' | 'saving' | 'saved'

Countdown logic (3 seconds before recording starts):
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
      setRecordingState('recording')
    }
  }, 1000)
}
```

## UI per state

- idle: show Webcam component + "▶ Start Recording" button
- countdown: show Webcam component + large number centered over video
- recording: show Webcam component + "⏹ Stop" + red dot + MM:SS timer
- stopped: show <video src={previewUrl} controls /> + "💾 Save" + "↺ Re-record"
- saving: show spinner + "Saving…"
- saved: show "✓ Saved" then call onSaved() after 1.5s

For the playback preview use a plain <video> element with src={previewUrl}
and controls. Do NOT use the Webcam component for playback.

## Saving

Same as before — use the File System Access API dirHandle to write the blob:
```js
const handleSave = async () => {
  setRecordingState('saving')
  const response = await fetch(previewUrl)
  const blob = await response.blob()
  const filename = buildFilename(video)
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
  URL.revokeObjectURL(previewUrl)
  setRecordingState('saved')
  setTimeout(() => onSaved(), 1500)
}
```

## Also: remove React StrictMode

In main.jsx, remove the <React.StrictMode> wrapper if present:
```jsx
// Change this:
root.render(<React.StrictMode><App /></React.StrictMode>)
// To this:
root.render(<App />)
```

## Spacebar shortcut
```js
useEffect(() => {
  const handleKey = (e) => {
    if (e.code !== 'Space') return
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return
    e.preventDefault()
    if (recordingState === 'idle') handleStartClick()
    if (recordingState === 'recording') stopRecording()
  }
  window.addEventListener('keydown', handleKey)
  return () => window.removeEventListener('keydown', handleKey)
}, [recordingState])
```

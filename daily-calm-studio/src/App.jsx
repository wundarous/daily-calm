import { useState, useEffect } from 'react'
import FirstRun from './components/FirstRun'
import SessionDashboard from './components/SessionDashboard'
import RecordingStudio from './components/RecordingStudio'
import { loadFolderHandle } from './lib/folderStore'
import './index.css'

export default function App() {
  const [appState, setAppState] = useState('loading') // loading | firstrun | dashboard | studio
  const [activeMonth, setActiveMonth] = useState(null)
  const [folderHandle, setFolderHandle] = useState(null)
  const [studioVideo, setStudioVideo] = useState(null)
  const [studioVideos, setStudioVideos] = useState([])

  useEffect(() => {
    async function init() {
      const month = localStorage.getItem('dc_active_month')
      const handle = await loadFolderHandle()

      if (!month || !handle) {
        setAppState('firstrun')
        return
      }

      const permission = await handle.requestPermission({ mode: 'readwrite' })
      if (permission === 'granted') {
        setActiveMonth(month)
        setFolderHandle(handle)
        setAppState('dashboard')
      } else {
        setAppState('firstrun')
      }
    }
    init()
  }, [])

  function handleFirstRunComplete({ month, folderHandle: handle }) {
    setActiveMonth(month)
    setFolderHandle(handle)
    setAppState('dashboard')
  }

  function handleSwitchMonth() {
    localStorage.removeItem('dc_active_month')
    setActiveMonth(null)
    setAppState('firstrun')
  }

  function handleRecord(video, videos) {
    setStudioVideo(video)
    setStudioVideos(videos)
    setAppState('studio')
  }

  function handleBackToDashboard() {
    setAppState('dashboard')
  }

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-calm-muted text-sm">Loading…</div>
      </div>
    )
  }

  if (appState === 'firstrun') {
    return <FirstRun onComplete={handleFirstRunComplete} />
  }

  if (appState === 'studio') {
    return (
      <RecordingStudio
        initialVideo={studioVideo}
        videos={studioVideos}
        folderHandle={folderHandle}
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <SessionDashboard
      month={activeMonth}
      folderHandle={folderHandle}
      onSwitchMonth={handleSwitchMonth}
      onRecord={handleRecord}
    />
  )
}

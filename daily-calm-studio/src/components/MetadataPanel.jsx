import HashtagPills from './HashtagPills'

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-white text-sm leading-snug">{value}</div>
    </div>
  )
}

export default function MetadataPanel({ video, videoIndex, totalVideos, sessionDoneCount, onBack }) {
  const dateObj = new Date(video.date + 'T00:00:00')
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex-1 space-y-5 overflow-y-auto">
        <Field label="Date"       value={dateLabel} />
        <Field label="Title"      value={video.title} />
        <Field label="Technique"  value={video.technique} />
        <Field label="Category"   value={video.technique_category} />
        <Field label="Goal"       value={video.goal} />
        <Field label="Moon Phase" value={video.moon_phase} />
        <Field label="Day Energy" value={video.day_energy} />
        <Field label="Thread #"   value={video.thread_number} />

        <div>
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
            Hashtags
          </div>
          <HashtagPills hashtags={video.hashtags} dark />
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-stone-800">
        <button
          onClick={onBack}
          className="text-stone-400 hover:text-white text-sm transition-colors"
        >
          ← Back to List
        </button>
        <div className="mt-2 text-xs text-stone-600">
          {videoIndex + 1} of {totalVideos} · {sessionDoneCount} done this session
        </div>
      </div>
    </div>
  )
}

export default function VideoRow({ video, status, isNextUp, onRecord }) {
  const dateObj = new Date(video.date + 'T00:00:00')
  const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const statusIcon =
    status === 'done'    ? <span className="text-green-500 font-bold text-base">✓</span>
    : isNextUp           ? <span className="text-calm-accent font-bold text-base">▶</span>
    :                      <span className="text-stone-300 text-base">○</span>

  return (
    <div
      className={`group flex items-center gap-4 px-5 py-3.5 border-b border-stone-100 transition-colors
        ${isNextUp ? 'bg-purple-50 border-l-2 border-l-calm-accent' : 'hover:bg-stone-50'}
        ${status === 'done' ? 'opacity-50' : ''}
      `}
    >
      {/* Status icon */}
      <div className="w-5 flex-shrink-0 flex justify-center">
        {statusIcon}
      </div>

      {/* Date */}
      <div className="w-12 flex-shrink-0 text-sm text-calm-muted font-medium">
        {dateLabel}
      </div>

      {/* Title + technique */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-stone-800 truncate">{video.title}</div>
        <div className="text-xs text-calm-muted truncate">{video.technique}</div>
      </div>

      {/* Category pill */}
      <div className="hidden sm:block flex-shrink-0">
        <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-medium">
          {video.technique_category}
        </span>
      </div>

      {/* Record button */}
      <div className="flex-shrink-0">
        <button
          onClick={() => onRecord(video)}
          className={`text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all
            ${isNextUp
              ? 'bg-calm-accent text-white hover:bg-purple-600'
              : 'opacity-0 group-hover:opacity-100 border border-stone-200 text-stone-600 hover:border-calm-accent hover:text-calm-accent bg-white'
            }
          `}
        >
          {status === 'done' ? 'Re-record' : '▶ Record'}
        </button>
      </div>
    </div>
  )
}

export default function HashtagPills({ hashtags, dark = false }) {
  if (!hashtags) return null
  const tags = hashtags.trim().split(/\s+/).filter(t => t.startsWith('#'))
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <span
          key={tag}
          className={`text-xs px-2 py-0.5 rounded-full ${
            dark
              ? 'bg-stone-800 text-stone-400'
              : 'bg-stone-100 text-calm-muted'
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

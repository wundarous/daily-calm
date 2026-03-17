# Daily Calm — Phase 1: Recording Studio

A simple local web app for recording Daily Calm videos across multiple
sessions. Monthly CSV files live inside the project. The app remembers
which videos are done by checking the output folder, and always picks up
where you left off.

Runs locally only. No backend. No auth. No deployment needed.

---

## Stack

- React + Vite + Tailwind CSS
- CSV files served as static assets from `content/`
- `localStorage` for persisting active month and folder handle
- File System Access API for picking output folder and saving recordings
- `MediaRecorder` API for webcam + mic recording
- PapaParse for CSV parsing (`npm install papaparse`)

---

## CSV Files

Monthly CSV files live in the `content/` folder at the project root:

```
content/
  2026-04.csv
  2026-05.csv
```

Naming convention: `YYYY-MM.csv`

The app fetches these directly (e.g. `fetch('/content/2026-04.csv')`).
To add a new month, just drop the CSV file into `content/`.

### CSV columns

```
date, day_energy, thread_number, moon_phase,
technique_category, technique, title, goal, hashtags
```

Example row:
```
2026-04-01,Mercury,1,Waxing,Breathwork,Dragon Breath,Daily Calm – Dragon Breath Reset,Energize mind,"#dailycalm #breathwork #mindreset #mindfulness"
```

### Vite static asset config

Add this to `vite.config.js` so the `content/` folder is served:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    fs: {
      allow: ['..']
    }
  }
})
```

Place the `content/` folder inside `public/` so Vite serves it as a
static asset:

```
public/
  content/
    2026-04.csv
    2026-05.csv
```

Fetch as: `fetch('/content/2026-04.csv')`

---

## Output Filename Format

```
YYYY-MM-DD_daily-calm_title-slug.webm
```

`title-slug` is the `title` field with "Daily Calm – " stripped, then
lowercased with spaces and special characters replaced by hyphens.

Examples:
- `2026-04-01_daily-calm_dragon-breath-reset.webm`
- `2026-04-02_daily-calm_heart-gratitude-meditation.webm`

---

## Persistence

### localStorage keys

```js
'dc_active_month'   // e.g. "2026-04" — which CSV is currently loaded
```

### Output folder handle

The `FileSystemDirectoryHandle` cannot be stored in localStorage. Store
it in IndexedDB under the key `dc_folder_handle`. On reload, retrieve
the handle and call `handle.requestPermission({ mode: 'readwrite' })`
to reactivate it. Wrap this in a small `lib/folderStore.js` helper.

---

## Determining "Done" Status

A video is **done** when its expected output filename already exists in
the chosen output folder.

On dashboard load (and after each save), scan the output folder:

```js
const names = []
for await (const [name] of dirHandle.entries()) {
  names.push(name)
}
```

Compare each video's expected filename against the scanned list. Done
status is always derived from the real filesystem — no manual tracking.

If the folder handle is missing or permission has lapsed, all statuses
show as unknown and a `🔓 Reconnect Folder` button is shown.

---

## App States

```
firstrun → dashboard → studio
              ↑____________↓  (after save, back to dashboard)
```

---

### State 1: First Run

Shown only when no active month is stored in localStorage OR no folder
handle exists in IndexedDB.

**Step 1 — Pick a month:**
- List all available CSVs found in `public/content/` by fetching a
  manifest, or hardcode a known list and try fetching each.
- Show as a simple list of buttons: `April 2026`, `May 2026`, etc.
- On select, fetch and parse the CSV, store `dc_active_month` to
  localStorage.

**Step 2 — Choose output folder:**
- Single button: `Choose Output Folder`
- Triggers `window.showDirectoryPicker()`
- Store handle in IndexedDB
- Show chosen folder name as confirmation

Once both steps are complete, transition to Dashboard automatically.

> **CSV manifest approach:** Since Vite doesn't support dynamic directory
> listing, maintain a simple `public/content/index.json` file that lists
> available CSVs:
> ```json
> ["2026-04.csv", "2026-05.csv"]
> ```
> The app fetches this manifest on load. When you add a new CSV, also
> add its filename to `index.json`.

---

### State 2: Session Dashboard

**Default screen on every return visit.**

#### Header
- Month label: `April 2026`
- Progress: `12 / 30 recorded`
- Thin progress bar
- Action buttons (top right):
  - `Switch Month` — clears active month, returns to month picker (keeps folder)
  - `Change Folder` — re-runs folder picker

#### Video list

Full scrollable list of all 30 videos, in CSV date order.

Each row:
- **Status icon:** `✓` (green) if done · `▶` (accent) if next up · `○` (muted) if pending
- **Date:** `Apr 1`
- **Title:** `Daily Calm – Dragon Breath Reset`
- **Technique:** `Dragon Breath`
- **Category pill:** `Breathwork`
- **Record button:** always visible on the next-up row; visible on hover for all others

On load:
- Scan output folder and mark done/pending
- Auto-scroll to the first unrecorded video (the "next up" row)
- The next-up row has a highlighted background and accent left border

Done rows are slightly dimmed but fully readable — not hidden.

#### Folder scanning state
While scanning show a subtle "Checking folder…" indicator.
If folder needs permission re-grant, show `🔓 Reconnect Folder` button
and block recording until reconnected.

---

### State 3: Recording Studio

Entered by clicking `▶ Record` on any video row.

Always dark background (`#0f0f0f`). Full screen.

#### Layout: two columns

**Left — Metadata Panel**

Displays all fields for the active video:

| Label | Example value |
|-------|--------------|
| Date | April 1, 2026 |
| Title | Daily Calm – Dragon Breath Reset |
| Technique | Dragon Breath |
| Category | Breathwork |
| Goal | Energize mind |
| Moon Phase | Waxing |
| Day Energy | Mercury |
| Thread # | 1 |
| Hashtags | pill tags |

Below metadata:
- `← Back to List` — returns to dashboard, no data lost
- Session context: `3 of 30 · 2 done this session`

**Right — Camera + Controls**

- Large live webcam preview (fills the column)
- Controls below the preview:

  | Recording state | UI shown |
  |----------------|----------|
  | Idle | `▶ Start Recording` |
  | Countdown | 3 … 2 … 1 … overlay on preview |
  | Recording | `⏹ Stop` + red pulsing dot + MM:SS timer |
  | Stopped | `▶ Preview` · `💾 Save` · `↺ Re-record` |
  | Saving | Spinner + "Saving…" |
  | Saved | `✓ Saved as 2026-04-01_daily-calm_dragon-breath-reset.webm` then auto-advance after 1.5s |

- `Space` to start/stop (disabled during countdown)
- Auto-advance after save goes to next unrecorded video

---

## Permission & Error Handling

- **Camera/mic denied:** Clear message + Retry button. Do not show the
  recording controls until permission is granted.
- **Non-Chromium browser:** Show a message on first run —
  "This app requires Chrome or Edge to save files. Please reopen in Chrome."
  Check via `'showDirectoryPicker' in window`.
- **Folder handle expired:** Show `🔓 Reconnect Folder` on dashboard.
  Block the Record button in studio until reconnected.
- **CSV fetch fails:** Show error with instructions to check that the
  file exists in `public/content/` and is listed in `index.json`.

---

## Component & File Structure

```
public/
  content/
    index.json              -- list of available CSV filenames
    2026-04.csv             -- monthly video data

src/
  App.jsx                   -- top-level state: firstrun | dashboard | studio
  components/
    FirstRun.jsx            -- month picker + folder picker
    SessionDashboard.jsx    -- video list, progress, folder scan
    VideoRow.jsx            -- single row in the list
    RecordingStudio.jsx     -- two-column studio layout
    MetadataPanel.jsx       -- left column
    CameraPanel.jsx         -- right column: preview + controls
    HashtagPills.jsx        -- renders hashtag string as pill tags
  lib/
    parseCSV.js             -- PapaParse wrapper
    slugify.js              -- title → filename slug
    folderStore.js          -- IndexedDB get/set for directory handle
    filesystem.js           -- scan folder, save file helpers
```

---

## Development Setup

```bash
npm create vite@latest daily-calm-studio -- --template react
cd daily-calm-studio
npm install papaparse
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

Open at `http://localhost:5173`

---

## Design Notes

- Dark studio environment for the recording screen
- Metadata panel: muted label colors, bright white values, generous spacing
- Camera preview as large as possible
- Countdown overlay: large centered number directly on the preview
- Setup/dashboard screens: light warm background contrasting with dark studio
- Font: DM Sans (import from Google Fonts)
- Tailwind custom colors: define `calm-bg`, `calm-accent`, `calm-muted` tokens

---

## Out of Scope for Phase 1

- Supabase / any backend
- User auth or roles
- Post-production pipeline
- Scheduling or caption tools
- Any deployment (local only)

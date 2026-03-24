import { useState, useEffect } from "react"
import type { SetlistSummary } from "@ts-monorepo/common"
import { searchSetlists } from "../api"

interface SetlistPickerProps {
  artistName: string
  onSelect: (setlist: SetlistSummary) => void
  selectedSetlist: SetlistSummary | null
}

export function SetlistPicker({
  artistName,
  onSelect,
  selectedSetlist,
}: SetlistPickerProps) {
  const [setlists, setSetlists] = useState<SetlistSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchSetlists() {
      setLoading(true)
      setError(null)
      try {
        const data = await searchSetlists(artistName)
        if (!cancelled) {
          setSetlists(data)
          if (data.length === 0) {
            setError("No recent setlists found for this artist.")
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to fetch setlists. Please try again.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSetlists()
    return () => {
      cancelled = true
    }
  }, [artistName])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <span className="loading loading-spinner loading-sm" />
        <span className="text-sm text-base-content/70">
          Searching setlists for {artistName}...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-warning mt-2">
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <label className="label">
        <span className="label-text font-medium">Choose a setlist</span>
      </label>
      <div className="flex flex-col gap-2">
        {setlists.map((setlist) => (
          <button
            key={setlist.setlistFmId}
            type="button"
            className={`btn btn-outline justify-start gap-3 text-left ${
              selectedSetlist?.setlistFmId === setlist.setlistFmId
                ? "btn-primary"
                : ""
            }`}
            onClick={() => onSelect(setlist)}
          >
            <div className="flex flex-col items-start">
              <span className="font-semibold">
                {setlist.venueName}, {setlist.cityName}
              </span>
              <span className="text-xs opacity-70">
                {setlist.date} · {setlist.songCount} songs
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

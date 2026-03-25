import type { ArtistSearchResult } from "@ts-monorepo/common"
import { useEffect, useRef, useState } from "react"
import { searchArtists } from "../api"

interface ArtistSearchProps {
  onSelect: (artist: ArtistSearchResult) => void
  selectedArtist: ArtistSearchResult | null
  onClear: () => void
}

export function ArtistSearch({
  onSelect,
  selectedArtist,
  onClear,
}: ArtistSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ArtistSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const artists = await searchArtists(query)
        setResults(artists)
        setShowDropdown(artists.length > 0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (selectedArtist) {
    return (
      <div className="bg-base-200 flex items-center gap-3 rounded-lg p-3">
        <span className="font-semibold">{selectedArtist.name}</span>
        <button
          className="btn btn-ghost btn-xs ml-auto"
          onClick={onClear}
          type="button"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="label">
        <span className="label-text font-medium">Artist</span>
      </label>
      <input
        type="text"
        placeholder="Search for an artist..."
        className="input input-bordered w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
      />
      {loading && (
        <span className="loading loading-spinner loading-sm absolute top-[52px] right-3" />
      )}

      {showDropdown && (
        <ul className="menu dropdown-content rounded-box bg-base-100 z-10 mt-1 max-h-60 w-full overflow-y-auto p-2 shadow-lg">
          {results.map((artist) => (
            <li key={artist.mbid}>
              <button
                className="flex items-center gap-3"
                onClick={() => {
                  onSelect(artist)
                  setQuery("")
                  setShowDropdown(false)
                }}
                type="button"
              >
                <span>{artist.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

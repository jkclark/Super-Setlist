import { useState } from "react"
import type {
  ArtistSearchResult,
  SetlistSummary,
  CreatePlaylistResponse,
} from "@ts-monorepo/common"
import { createPlaylist } from "../api"
import { ArtistSearch } from "./ArtistSearch"
import { SetlistPicker } from "./SetlistPicker"

export function PlaylistForm() {
  const [selectedArtist, setSelectedArtist] =
    useState<ArtistSearchResult | null>(null)
  const [selectedSetlist, setSelectedSetlist] =
    useState<SetlistSummary | null>(null)
  const [playlistName, setPlaylistName] = useState("")
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<CreatePlaylistResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleArtistSelect(artist: ArtistSearchResult) {
    setSelectedArtist(artist)
    setSelectedSetlist(null)
    setPlaylistName(`${artist.name} – Concert Prep`)
    setResult(null)
    setError(null)
  }

  function handleArtistClear() {
    setSelectedArtist(null)
    setSelectedSetlist(null)
    setPlaylistName("")
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedArtist || !selectedSetlist || !playlistName.trim()) return

    setCreating(true)
    setError(null)
    setResult(null)

    try {
      const response = await createPlaylist({
        artistSpotifyId: selectedArtist.spotifyId,
        artistName: selectedArtist.name,
        playlistName: playlistName.trim(),
        setlistFmId: selectedSetlist.setlistFmId,
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playlist")
    } finally {
      setCreating(false)
    }
  }

  const canSubmit =
    selectedArtist && selectedSetlist && playlistName.trim() && !creating

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ArtistSearch
        onSelect={handleArtistSelect}
        selectedArtist={selectedArtist}
        onClear={handleArtistClear}
      />

      {selectedArtist && (
        <SetlistPicker
          artistName={selectedArtist.name}
          onSelect={setSelectedSetlist}
          selectedSetlist={selectedSetlist}
        />
      )}

      {selectedSetlist && (
        <div>
          <label className="label">
            <span className="label-text font-medium">Playlist name</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="My concert prep playlist"
          />
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="alert alert-success flex-col items-start gap-1">
          <span className="font-semibold">Playlist created!</span>
          <span className="text-sm">
            {result.trackCount} tracks added ({result.setlistSongsFound} of{" "}
            {result.setlistSongsTotal} setlist songs found)
          </span>
          <a
            href={result.playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary mt-2"
          >
            Open in Spotify
          </a>
        </div>
      )}

      {selectedSetlist && !result && (
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSubmit}
        >
          {creating ? (
            <>
              <span className="loading loading-spinner loading-sm" />
              Creating playlist...
            </>
          ) : (
            "Go"
          )}
        </button>
      )}
    </form>
  )
}

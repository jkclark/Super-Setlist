import type { SetlistSummary } from "@ts-monorepo/common"

const SETLISTFM_API_BASE = "https://api.setlist.fm/rest/1.0"

interface SetlistFmSong {
  name: string
  cover?: { name: string }
}

interface SetlistFmSet {
  song: SetlistFmSong[]
}

interface SetlistFmSetlist {
  id: string
  eventDate: string
  venue: {
    name: string
    city: {
      name: string
      country: { name: string }
    }
  }
  sets: {
    set: SetlistFmSet[]
  }
}

async function setlistFmFetch(endpoint: string): Promise<any> {
  const response = await fetch(`${SETLISTFM_API_BASE}${endpoint}`, {
    headers: {
      Accept: "application/json",
      "x-api-key": process.env.SETLISTFM_API_KEY || "",
    },
  })

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10)
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return setlistFmFetch(endpoint)
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`setlist.fm API error (${response.status}): ${error}`)
  }

  return response.json()
}

function countSongs(setlist: SetlistFmSetlist): number {
  return (setlist.sets?.set || []).reduce(
    (total: number, s: SetlistFmSet) => total + (s.song?.length || 0),
    0
  )
}

function formatDate(eventDate: string): string {
  // setlist.fm returns dates as dd-MM-yyyy
  const [day, month, year] = eventDate.split("-")
  return `${year}-${month}-${day}`
}

export async function searchSetlists(
  artistName: string
): Promise<SetlistSummary[]> {
  const data = await setlistFmFetch(
    `/search/setlists?artistName=${encodeURIComponent(artistName)}&p=1`
  )

  const allSetlists: SetlistFmSetlist[] = data.setlist || []

  // Filter to setlists with at least 3 songs, take first 3
  const qualifying = allSetlists
    .filter((s) => countSongs(s) >= 3)
    .slice(0, 3)

  return qualifying.map((s) => ({
    setlistFmId: s.id,
    venueName: s.venue?.name || "Unknown Venue",
    cityName: s.venue?.city?.name || "Unknown City",
    date: formatDate(s.eventDate),
    songCount: countSongs(s),
  }))
}

export interface SetlistSong {
  name: string
  originalArtist?: string // present if it's a cover
}

export async function getSetlistSongs(
  setlistId: string
): Promise<SetlistSong[]> {
  const data: SetlistFmSetlist = await setlistFmFetch(
    `/setlist/${setlistId}`
  )

  const songs: SetlistSong[] = []
  for (const set of data.sets?.set || []) {
    for (const song of set.song || []) {
      if (song.name) {
        songs.push({
          name: song.name,
          originalArtist: song.cover?.name,
        })
      }
    }
  }

  return songs
}

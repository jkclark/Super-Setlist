export interface UserProfile {
  displayName: string
  avatarUrl: string | null
}

export interface ArtistSearchResult {
  mbid: string
  name: string
}

export interface SetlistSummary {
  setlistFmId: string
  venueName: string
  cityName: string
  date: string
  songCount: number
}

export interface CreatePlaylistRequest {
  artistName: string
  playlistName: string
  setlistFmId: string
}

export interface CreatePlaylistResponse {
  playlistUrl: string
  trackCount: number
  setlistSongsFound: number
  setlistSongsTotal: number
}

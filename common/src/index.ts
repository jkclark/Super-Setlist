export interface SpotifyUser {
  displayName: string
  avatarUrl: string | null
}

export interface ArtistSearchResult {
  spotifyId: string
  name: string
  imageUrl: string | null
}

export interface SetlistSummary {
  setlistFmId: string
  venueName: string
  cityName: string
  date: string
  songCount: number
}

export interface CreatePlaylistRequest {
  artistSpotifyId: string
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

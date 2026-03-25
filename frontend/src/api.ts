import type {
  ArtistSearchResult,
  CreatePlaylistRequest,
  CreatePlaylistResponse,
  SetlistSummary,
  UserProfile,
} from "@ts-monorepo/common"

const API_BASE = "/api"

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${response.status}`)
  }

  return response.json()
}

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/me")
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout")
}

export async function searchArtists(
  query: string,
): Promise<ArtistSearchResult[]> {
  if (!query.trim()) return []
  return apiFetch<ArtistSearchResult[]>(
    `/artists/search?q=${encodeURIComponent(query)}`,
  )
}

export async function searchSetlists(
  artistName: string,
): Promise<SetlistSummary[]> {
  return apiFetch<SetlistSummary[]>(
    `/setlists?artistName=${encodeURIComponent(artistName)}`,
  )
}

export async function createPlaylist(
  request: CreatePlaylistRequest,
): Promise<CreatePlaylistResponse> {
  return apiFetch<CreatePlaylistResponse>("/playlists", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

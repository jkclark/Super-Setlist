import type { ArtistSearchResult } from "@ts-monorepo/common"
import { Router } from "express"
import { getValidTokens, requireAuth, spotifyFetch } from "../utils/spotify"

export const artistRoutes: Router = Router()

artistRoutes.get("/search", requireAuth, async (req, res) => {
  const query = req.query.q as string | undefined
  if (!query || query.trim().length === 0) {
    res.json([])
    return
  }

  const tokens = await getValidTokens(req, res)
  if (!tokens) {
    res.status(401).json({ error: "Not authenticated" })
    return
  }

  try {
    const data = await spotifyFetch(
      tokens.accessToken,
      `/search?${new URLSearchParams({ q: query, type: "artist", limit: "8" })}`,
    )

    const artists: ArtistSearchResult[] = (data.artists?.items || []).map(
      (artist: any) => ({
        spotifyId: artist.id,
        name: artist.name,
        imageUrl: artist.images?.[0]?.url || null,
      }),
    )

    res.json(artists)
  } catch (err) {
    console.error("Artist search error:", err)
    res.status(500).json({ error: "Failed to search artists" })
  }
})

import type { ArtistSearchResult } from "@ts-monorepo/common"
import { Router } from "express"
import { requireAuth } from "../utils/youtube"

export const artistRoutes: Router = Router()

artistRoutes.get("/search", requireAuth, async (req, res) => {
  const query = req.query.q as string | undefined
  if (!query || query.trim().length === 0) {
    res.json([])
    return
  }

  try {
    const response = await fetch(
      `https://api.setlist.fm/rest/1.0/search/artists?${new URLSearchParams({
        artistName: query,
        p: "1",
        sort: "relevance",
      })}`,
      {
        headers: {
          Accept: "application/json",
          "x-api-key": process.env.SETLISTFM_API_KEY || "",
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) {
        res.json([])
        return
      }
      throw new Error(`setlist.fm error: ${response.status}`)
    }

    const data = await response.json()
    const artists: ArtistSearchResult[] = (data.artist || [])
      .filter((a: any) => a.mbid)
      .slice(0, 8)
      .map((a: any) => ({
        mbid: a.mbid,
        name: a.name,
      }))

    res.json(artists)
  } catch (err) {
    console.error("Artist search error:", err)
    res.status(500).json({ error: "Failed to search artists" })
  }
})

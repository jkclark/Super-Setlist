import { Router } from "express"
import { requireAuth } from "../utils/spotify"
import { searchSetlists } from "../utils/setlistfm"

export const setlistRoutes: Router = Router()

setlistRoutes.get("/", requireAuth, async (req, res) => {
  const artistName = req.query.artistName as string | undefined
  if (!artistName || artistName.trim().length === 0) {
    res.status(400).json({ error: "artistName query parameter is required" })
    return
  }

  try {
    const setlists = await searchSetlists(artistName)
    res.json(setlists)
  } catch (err) {
    console.error("Setlist search error:", err)
    res.status(500).json({ error: "Failed to search setlists" })
  }
})

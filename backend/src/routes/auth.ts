import type { SpotifyUser } from "@ts-monorepo/common"
import { Router } from "express"
import {
  clearTokenCookie,
  exchangeCodeForTokens,
  getSpotifyAuthUrl,
  getValidTokens,
  setTokenCookie,
  spotifyFetch,
} from "../utils/spotify"

export const authRoutes: Router = Router()

authRoutes.get("/spotify/login", (_req, res) => {
  res.redirect(getSpotifyAuthUrl())
})

authRoutes.get("/spotify/callback", async (req, res) => {
  const code = req.query.code as string | undefined
  const error = req.query.error as string | undefined

  if (error || !code) {
    res.redirect(
      `${process.env.FRONTEND_URL}?error=${encodeURIComponent(error || "No authorization code received")}`,
    )
    return
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    setTokenCookie(res, tokens)
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3001")
  } catch (err) {
    console.error("OAuth callback error:", err)
    res.redirect(
      `${process.env.FRONTEND_URL}?error=${encodeURIComponent("Authentication failed")}`,
    )
  }
})

authRoutes.get("/me", async (req, res) => {
  const tokens = await getValidTokens(req, res)
  if (!tokens) {
    res.status(401).json({ error: "Not authenticated" })
    return
  }

  try {
    const profile = await spotifyFetch(tokens.accessToken, "/me")
    const user: SpotifyUser = {
      displayName: profile.display_name || "Spotify User",
      avatarUrl: profile.images?.[0]?.url || null,
    }
    res.json(user)
  } catch (err) {
    console.error("Failed to fetch profile:", err)
    res.status(500).json({ error: "Failed to fetch Spotify profile" })
  }
})

authRoutes.get("/logout", (_req, res) => {
  clearTokenCookie(res)
  res.json({ success: true })
})

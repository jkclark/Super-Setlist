import type { UserProfile } from "@ts-monorepo/common"
import { Router } from "express"
import {
  clearTokenCookie,
  exchangeCodeForTokens,
  getGoogleAuthUrl,
  getValidTokens,
  setTokenCookie,
  youtubeFetch,
} from "../utils/youtube"

export const authRoutes: Router = Router()

authRoutes.get("/google/login", (_req, res) => {
  res.redirect(getGoogleAuthUrl())
})

authRoutes.get("/google/callback", async (req, res) => {
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
    res.redirect(process.env.FRONTEND_URL || "http://127.0.0.1:3001")
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
    const data = await youtubeFetch(
      tokens.accessToken,
      "/channels?part=snippet&mine=true",
    )
    const channel = data.items?.[0]
    const user: UserProfile = {
      displayName: channel?.snippet?.title || "YouTube User",
      avatarUrl: channel?.snippet?.thumbnails?.default?.url || null,
    }
    res.json(user)
  } catch (err) {
    console.error("Failed to fetch profile:", err)
    res.status(500).json({ error: "Failed to fetch YouTube profile" })
  }
})

authRoutes.get("/logout", (_req, res) => {
  clearTokenCookie(res)
  res.json({ success: true })
})

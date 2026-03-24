import type { Request, Response, NextFunction } from "express"
import crypto from "crypto"

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

const COOKIE_NAME = "ss_session"

interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

// --- Cookie encryption helpers ---

function getEncryptionKey(): Buffer {
  const secret = process.env.COOKIE_SECRET || ""
  return crypto.scryptSync(secret, "salt", 32)
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    getEncryptionKey(),
    iv
  )
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// --- Cookie management ---

export function setTokenCookie(res: Response, tokens: SpotifyTokens): void {
  const encrypted = encrypt(JSON.stringify(tokens))
  res.cookie(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    signed: true,
  })
}

export function getTokensFromCookie(req: Request): SpotifyTokens | null {
  const cookie = req.signedCookies[COOKIE_NAME]
  if (!cookie) return null
  try {
    return JSON.parse(decrypt(cookie))
  } catch {
    return null
  }
}

export function clearTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME)
}

// --- OAuth helpers ---

export function getSpotifyAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || "",
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
    scope: [
      "playlist-modify-public",
      "playlist-modify-private",
      "user-read-private",
      "user-read-email",
    ].join(" "),
    show_dialog: "true",
  })
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string
): Promise<SpotifyTokens> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI || "",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Spotify token exchange failed: ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

async function refreshAccessToken(
  refreshToken: string
): Promise<SpotifyTokens> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh Spotify token")
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// --- Spotify API helpers ---

export async function getValidTokens(
  req: Request,
  res: Response
): Promise<SpotifyTokens | null> {
  const tokens = getTokensFromCookie(req)
  if (!tokens) return null

  // Refresh if token expires within 5 minutes
  if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken)
      setTokenCookie(res, newTokens)
      return newTokens
    } catch {
      return null
    }
  }

  return tokens
}

export async function spotifyFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${SPOTIFY_API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10)
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return spotifyFetch(accessToken, endpoint, options)
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Spotify API error (${response.status}): ${error}`)
  }

  if (response.status === 204) return null
  return response.json()
}

// --- Auth middleware ---

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const tokens = getTokensFromCookie(req)
  if (!tokens) {
    res.status(401).json({ error: "Not authenticated" })
    return
  }
  next()
}

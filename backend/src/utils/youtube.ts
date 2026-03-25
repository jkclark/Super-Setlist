import crypto from "crypto"
import type { NextFunction, Request, Response } from "express"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

const COOKIE_NAME = "ss_session"

interface OAuthTokens {
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
    iv,
  )
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}

// --- Cookie management ---

export function setTokenCookie(res: Response, tokens: OAuthTokens): void {
  const encrypted = encrypt(JSON.stringify(tokens))
  res.cookie(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    signed: true,
  })
}

export function getTokensFromCookie(req: Request): OAuthTokens | null {
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

// --- Google OAuth helpers ---

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<OAuthTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google token exchange failed: ${error}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh Google token")
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

// --- YouTube API helpers ---

export async function getValidTokens(
  req: Request,
  res: Response,
): Promise<OAuthTokens | null> {
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

export async function youtubeFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${YOUTUBE_API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10)
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return youtubeFetch(accessToken, endpoint, options)
  }

  if (!response.ok) {
    const error = await response.text()
    console.error(`YouTube API ${response.status} for ${endpoint}:`, error)
    throw new Error(`YouTube API error (${response.status}): ${error}`)
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

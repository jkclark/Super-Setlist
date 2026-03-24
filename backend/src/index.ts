import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import { artistRoutes } from "./routes/artists"
import { authRoutes } from "./routes/auth"
import { playlistRoutes } from "./routes/playlists"
import { setlistRoutes } from "./routes/setlists"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser(process.env.COOKIE_SECRET))

app.use("/api/auth", authRoutes)
app.use("/api/artists", artistRoutes)
app.use("/api/setlists", setlistRoutes)
app.use("/api/playlists", playlistRoutes)

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

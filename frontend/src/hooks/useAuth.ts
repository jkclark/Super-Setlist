import { useState, useEffect, useCallback } from "react"
import type { SpotifyUser } from "@ts-monorepo/common"
import { getMe, logout as apiLogout } from "../api"

interface AuthState {
  user: SpotifyUser | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  const checkAuth = useCallback(async () => {
    try {
      const user = await getMe()
      setState({ user, loading: false, error: null })
    } catch {
      setState({ user: null, loading: false, error: null })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = () => {
    window.location.href = "/api/auth/spotify/login"
  }

  const logout = async () => {
    await apiLogout()
    setState({ user: null, loading: false, error: null })
  }

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    logout,
  }
}

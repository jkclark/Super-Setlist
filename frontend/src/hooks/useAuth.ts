import type { UserProfile } from "@ts-monorepo/common"
import { useCallback, useEffect, useState } from "react"
import { logout as apiLogout, getMe } from "../api"

interface AuthState {
  user: UserProfile | null
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
    window.location.href = "/api/auth/google/login"
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

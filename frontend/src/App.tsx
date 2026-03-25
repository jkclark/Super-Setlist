import { PlaylistForm } from "./components/PlaylistForm"
import { useAuth } from "./hooks/useAuth"

function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) {
    return (
      <div className="bg-base-200 flex min-h-dvh items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="bg-base-200 text-base-content flex min-h-dvh flex-col">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <span className="btn btn-ghost text-xl normal-case">
            🎸 Super Setlist
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            {user.avatarUrl && (
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={user.avatarUrl} alt={user.displayName} />
                </div>
              </div>
            )}
            <span className="text-sm font-medium">{user.displayName}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        {user ? (
          <div className="card bg-base-100 w-full max-w-md shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-2">
                Create a Concert Prep Playlist
              </h2>
              <p className="text-base-content/70 mb-4 text-sm">
                Search for an artist, pick a recent setlist, and we'll create a
                shuffled YouTube playlist with the setlist songs plus extras —
                so you can learn all the songs without spoiling the order.
              </p>
              <PlaylistForm />
            </div>
          </div>
        ) : (
          <div className="card bg-base-100 w-full max-w-sm shadow-xl">
            <div className="card-body items-center text-center">
              <h1 className="card-title text-2xl">🎸 Super Setlist</h1>
              <p className="text-base-content/70">
                Get ready for your next concert. Create a shuffled YouTube
                playlist from an artist's setlist — without spoiling the order.
              </p>
              <button className="btn btn-primary mt-4" onClick={login}>
                Log in with Google
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

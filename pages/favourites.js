import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Loader2 } from 'lucide-react'
import FacilityCard from '@/components/FacilityCard'
import toast from 'react-hot-toast'

export default function FavouritesPage() {
  const [favourites, setFavourites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch favourites from real API
  useEffect(() => {
    async function fetchFavourites() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/favourites')
        const data = await res.json()

        if (res.status === 401) {
          setError('You must be logged in to view your favourites.')
          return
        }

        if (data.success) {
          setFavourites(data.data)
        } else {
          setError('Failed to load favourites.')
        }
      } catch {
        setError('Something went wrong.')
      } finally {
        setLoading(false)
      }
    }

    fetchFavourites()
  }, [])

  async function handleRemoveFavourite(facilityId) {
    try {
      const res = await fetch(`/api/favourites?facility_id=${facilityId}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        // Remove from local state immediately
        setFavourites(prev => prev.filter(f => f.facility_id !== facilityId))
        toast('Removed from favourites', { icon: '💔' })
      } else {
        toast.error(data.error || 'Failed to remove favourite.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  // ── Error / not logged in ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-green-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Favourites
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {favourites.length} saved {favourites.length === 1 ? 'facility' : 'facilities'}
          </p>
        </div>

        {favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {favourites.map(f => (
              <FacilityCard
                key={f.facility_id}
                facility={f}
                isFavourited={true}
                onToggleFavourite={handleRemoveFavourite}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center justify-center mb-4">
              <Star size={32} className="text-yellow-300" />
            </div>
            <h3 className="font-bold text-gray-500 text-lg mb-2">No favourites yet</h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-6">
              Tap the heart icon on any facility card to save it here for quick access.
            </p>
            <Link
              href="/facilities"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 will-change-transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Browse Facilities
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

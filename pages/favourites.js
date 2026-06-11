import { useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import FacilityCard from '@/components/FacilityCard'
import { FACILITIES, FAVOURITES } from '@/lib/fakeData'
import toast from 'react-hot-toast'

export default function FavouritesPage() {
  const [favIds, setFavIds] = useState(FAVOURITES.map(f => f.facility_id))

  function toggleFav(id) {
    setFavIds(prev => {
      if (prev.includes(id)) {
        toast('Removed from favourites', { icon: '💔' })
        return prev.filter(f => f !== id)
      } else {
        toast.success('Added to favourites!')
        return [...prev, id]
      }
    })
  }

  const favFacilities = FACILITIES.filter(f => favIds.includes(f.facility_id))

  return (
    <div className="min-h-screen bg-green-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Favourites
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {favFacilities.length} saved {favFacilities.length === 1 ? 'facility' : 'facilities'}
          </p>
        </div>

        {favFacilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {favFacilities.map(f => (
              <FacilityCard
                key={f.facility_id}
                facility={f}
                isFavourited={true}
                onToggleFavourite={toggleFav}
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

